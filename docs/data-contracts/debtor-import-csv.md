# Debtor Import CSV Contract v1.0

Этот контракт описывает минимальный формат CSV для импорта базы должников в MVP.

## Формат файла

- Формат: CSV (значения через запятую).
- Кодировка: UTF-8.
- Первая строка обязана быть заголовком.
- Разделитель: `,`.
- Поля чувствителены к регистру имён колонок.
- Каждая строка после заголовка — один должник.
- Для одного файла значение `externalId` должно быть уникальным.

## Обязательные поля

| Поле | Тип | Описание | Пример |
| --- | --- | --- | --- |
| `externalId` | `string` | Идентификатор должника в исходной системе клиента (tenant scope, уникален внутри tenant). | `AB-1001` |
| `phone` | `string` | Номер телефона в любом формате; будет нормализован в валидный E.164-подобный формат перед импортом. | `+7 (950) 123-45-67` |
| `timezone` | `string` | IANA time zone name для соблюдения time-window и локального планирования звонков. | `Europe/Moscow` |
| `debtAmount` | `number` | Сумма задолженности в основных денежных единицах. Допускаются дробные значения с точкой. | `15320.50` |
| `debtStatus` | `enum` | Статус долга. Допустимые значения: `active`, `closed`, `disputed`, `bankruptcy`, `contact_forbidden`. | `active` |
| `consentStatus` | `enum` | Статус согласия на контакт. Допустимые значения: `pending`, `given`, `revoked`. | `given` |

## Опциональные поля идентификации

Эти колонки не обязательны для Lab/sandbox. Если колонок нет, импорт проходит как раньше. Если колонки есть, значения сохраняются в записи должника (tenant + campaign scope) для последующей сверки личности (`T-155`) без использования `debtAmount`.

Не импортировать: дату рождения, паспорт, voiceprint.

| Поле | Тип | Описание | Пример |
| --- | --- | --- | --- |
| `displayName` | `string` | Имя/ФИО как в файле клиента. Пустая ячейка → `null`. | `Иванов И.И.` |
| `agreementRef` | `string` | Номер или хвост договора. Пустая ячейка → `null`. | `ДГ-4412` |

## Пример валидного CSV

```csv
externalId,phone,timezone,debtAmount,debtStatus,consentStatus
AB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given
CD-1002,+7 903 222 11 22,Asia/Yekaterinburg,5600,active,pending
EF-1003,+1 415 555 0199,America/Los_Angeles,250.75,disputed,pending
```

Пример с опциональными полями идентификации:

```csv
externalId,phone,timezone,debtAmount,debtStatus,consentStatus,displayName,agreementRef
AB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given,Иванов И.И.,ДГ-4412
CD-1002,+7 903 222 11 22,Asia/Yekaterinburg,5600,active,pending,,
```

## Базовая валидация импорта

1. Проверка структуры: файл не пустой, присутствует header.
2. Проверка обязательных колонок (`externalId`, `phone`, `timezone`, `debtAmount`, `debtStatus`, `consentStatus`). Колонки `displayName` и `agreementRef` не обязательны.
3. Проверка форматов и типов по каждому столбцу.
4. Проверка допустимых enum-значений для `debtStatus` и `consentStatus`.
5. Сбор ошибок по строкам для последующего `quarantine` без частичной атомарной загрузки.
