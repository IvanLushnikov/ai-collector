import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { normalizeRole } from '../server/authz/index.js';
import {
  SESSION_TTL_SECONDS,
  buildExpiredSessionCookie,
  buildSessionCookie,
  createSessionToken,
  hashSessionToken,
  parseCookieHeader,
  SESSION_COOKIE_NAME
} from '../auth/session-token.js';

type AuthDependencies = {
  tenant: {
    create: (args: any) => Promise<unknown>;
    findUnique: (args: any) => Promise<unknown>;
  };
  role: {
    create: (args: any) => Promise<unknown>;
    findFirst: (args: any) => Promise<unknown>;
  };
  user: {
    create: (args: any) => Promise<unknown>;
    findFirst: (args: any) => Promise<unknown>;
  };
  tenantMembership?: {
    create?: (args: any) => Promise<unknown>;
  };
  session: {
    create: (args: any) => Promise<unknown>;
    findFirst: (args: any) => Promise<unknown>;
    update: (args: any) => Promise<unknown>;
  };
};

const registerSchema = z.object({
  organizationName: z.string().trim().min(1),
  name: z.string().trim().min(1),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

type UserRecord = {
  id: string;
  tenantId: string;
  roleId: string;
  email: string;
  name: string;
  passwordHash?: string | null;
  isActive?: boolean;
  status?: string;
  role?: { name?: string } | null;
  tenant?: { id?: string; name?: string } | null;
};

type SessionRecord = {
  id: string;
  tokenHash: string;
  userId: string;
  tenantId: string;
  roleName: string;
  expiresAt: string | Date;
  revokedAt?: string | Date | null;
};

const toPublicAuth = (user: UserRecord, tenantName: string, roleName: string) => ({
  user: {
    id: user.id,
    name: user.name,
    email: user.email
  },
  tenant: {
    id: user.tenantId,
    name: tenantName
  },
  role: roleName
});

const createSessionForUser = async (
  deps: AuthDependencies,
  user: UserRecord,
  roleName: string
): Promise<string> => {
  const canonicalRole = normalizeRole(roleName) ?? 'tenant_owner';
  const token = createSessionToken();
  await deps.session.create({
    data: {
      tokenHash: token.tokenHash,
      userId: user.id,
      tenantId: user.tenantId,
      roleName: canonicalRole,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
    }
  });
  return token.raw;
};

export const findSessionByRawToken = async (
  deps: AuthDependencies,
  rawToken: string
): Promise<SessionRecord | null> => {
  const tokenHash = hashSessionToken(rawToken);
  const session = await deps.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null
    }
  }) as SessionRecord | null;
  if (!session) {
    return null;
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }
  return session;
};

export const resolveSessionFromRequest = async (
  deps: AuthDependencies,
  cookieHeader: string | undefined
): Promise<SessionRecord | null> => {
  const raw = parseCookieHeader(cookieHeader, SESSION_COOKIE_NAME);
  if (!raw) {
    return null;
  }
  return findSessionByRawToken(deps, raw);
};

export const registerAuthRoutes = (app: FastifyInstance, deps: AuthDependencies, secureCookies = false): void => {
  app.post('/auth/register', async (request, reply) => {
    const payload = registerSchema.safeParse(request.body);
    if (!payload.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: payload.error.issues
      });
    }

    const existing = await deps.user.findFirst({
      where: { email: payload.data.email }
    }) as UserRecord | null;
    if (existing) {
      return reply.code(409).send({
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'Пользователь с таким email уже зарегистрирован.'
      });
    }

    const tenant = await deps.tenant.create({
      data: {
        name: payload.data.organizationName
      }
    }) as { id: string; name: string };

    let role = await deps.role.findFirst({
      where: {
        tenantId: tenant.id,
        name: 'owner'
      }
    }) as { id: string; name: string } | null;
    if (!role) {
      role = await deps.role.create({
        data: {
          tenantId: tenant.id,
          name: 'owner',
          description: 'Владелец организации',
          isSystem: true
        }
      }) as { id: string; name: string };
    }

    const passwordHash = await hashPassword(payload.data.password);
    const user = await deps.user.create({
      data: {
        tenantId: tenant.id,
        roleId: role.id,
        email: payload.data.email,
        name: payload.data.name,
        passwordHash,
        status: 'active',
        isActive: true
      }
    }) as UserRecord;

    await deps.tenantMembership?.create?.({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        roleName: 'tenant_owner'
      }
    });

    const canonicalRole = normalizeRole(role.name) ?? 'tenant_owner';
    const rawToken = await createSessionForUser(deps, user, canonicalRole);
    reply.header('Set-Cookie', buildSessionCookie(rawToken, undefined, secureCookies));
    return reply.code(201).send(toPublicAuth(user, tenant.name, canonicalRole));
  });

  app.post('/auth/login', async (request, reply) => {
    const payload = loginSchema.safeParse(request.body);
    if (!payload.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: payload.error.issues
      });
    }

    const user = await deps.user.findFirst({
      where: { email: payload.data.email },
      include: { role: true, tenant: true }
    }) as UserRecord | null;

    if (!user?.passwordHash || user.isActive === false || user.status === 'inactive') {
      return reply.code(401).send({
        error: 'INVALID_CREDENTIALS',
        message: 'Не удалось войти. Проверьте email и пароль.'
      });
    }

    const matches = await verifyPassword(user.passwordHash, payload.data.password);
    if (!matches) {
      return reply.code(401).send({
        error: 'INVALID_CREDENTIALS',
        message: 'Не удалось войти. Проверьте email и пароль.'
      });
    }

    const roleName = normalizeRole(user.role?.name || 'owner') ?? 'tenant_owner';
    const tenantName = user.tenant?.name || '';
    const rawToken = await createSessionForUser(deps, user, roleName);
    reply.header('Set-Cookie', buildSessionCookie(rawToken, undefined, secureCookies));
    return reply.code(200).send(toPublicAuth(user, tenantName, roleName));
  });

  app.post('/auth/logout', async (request, reply) => {
    const session = await resolveSessionFromRequest(deps, request.headers.cookie);
    if (session) {
      await deps.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() }
      });
    }
    reply.header('Set-Cookie', buildExpiredSessionCookie(secureCookies));
    return reply.code(204).send();
  });

  app.get('/auth/me', async (request, reply) => {
    const session = await resolveSessionFromRequest(deps, request.headers.cookie);
    if (!session) {
      return reply.code(200).send({ authenticated: false });
    }

    const user = await deps.user.findFirst({
      where: { id: session.userId },
      include: { role: true, tenant: true }
    }) as UserRecord | null;
    if (!user) {
      return reply.code(200).send({ authenticated: false });
    }

    return reply.code(200).send({
      authenticated: true,
      ...toPublicAuth(user, user.tenant?.name || '', normalizeRole(session.roleName || user.role?.name || 'owner') ?? 'tenant_owner')
    });
  });
};
