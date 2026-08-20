import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/prototype.html', import.meta.url), 'utf8');
const overview = html.match(/<div class="campaign-view active" data-camp-view="overview">[\s\S]*?<div class="campaign-view" data-camp-view="base">/)?.[0] ?? '';

describe('prototype campaign building blocks (OP-D-012)', () => {
  it('keeps prototype and public HTML in sync', () => {
    expect(publicHtml).toBe(html);
  });

  it('shows five launch blocks on overview without BPM or AI magic copy', () => {
    expect(overview).toContain('id="campaignOverviewBlocksPanel"');
    expect(overview).toContain('id="campaignReadinessBlocks"');
    expect(overview).toContain('>База<');
    expect(overview).toContain('>Сценарий<');
    expect(overview).toContain('>Телефония<');
    expect(overview).toContain('>Готовность<');
    expect(overview).toContain('>Режим<');
    expect(overview).toContain('id="campaignLaunchBaseStatus"');
    expect(overview).toContain('id="campaignLaunchScriptStatus"');
    expect(overview).toContain('id="campaignLaunchPhoneStatus"');
    expect(overview).toContain('id="campaignLaunchLimitsStatus"');
    expect(overview).toContain('id="campaignLaunchModeStatus"');
    expect(overview).not.toContain('ready-icon');
    expect(overview).not.toContain('BPM');
    expect(html).not.toMatch(/ИИ всё настроил/i);
  });

  it('starts readiness block as needs-check and wires API-driven helpers', () => {
    expect(overview).toMatch(/id="campaignLaunchLimitsStatus"[^>]*>Нужна проверка/);
    expect(html).toContain('buildingBlockMeta');
    expect(html).toContain('setBuildingBlockItem');
    expect(html).toContain('resolveReadinessBuildingBlockState');
    expect(html).toContain('resolveModeBuildingBlockState');
    expect(html).toContain('label:\'OK\'');
    expect(html).toContain('label:\'Блокирует\'');
  });

  it('keeps launch disabled when readiness is not ready (T-213)', () => {
    expect(html).toContain('launchButton.disabled = !canRun');
    expect(html).toContain('id="campaignLaunchBlockingGroup"');
    expect(html).toContain('id="campaignLaunchWarningGroup"');
    expect(html).toContain('Блокирует запуск');
  });

  it('places building blocks between risk banners and KPI cards', () => {
    const riskIdx = overview.indexOf('id="campaignOverviewRiskStack"');
    const blocksIdx = overview.indexOf('id="campaignOverviewBlocksPanel"');
    const kpiIdx = overview.indexOf('id="campaignOverviewKpis"');
    expect(riskIdx).toBeGreaterThan(-1);
    expect(blocksIdx).toBeGreaterThan(riskIdx);
    expect(kpiIdx).toBeGreaterThan(blocksIdx);
  });
});
