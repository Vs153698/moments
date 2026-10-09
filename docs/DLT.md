# MSG91 DLT Registration — India SMS (F8.1 / KAN-101)

India TRAI DLT rules require every SMS sender to register the business entity
and get each message template approved before any OTP/transactional SMS can
be delivered. Approval lead time is typically **3–7 working days**, so this
must be submitted **before** the F7 auth flows go live.

## Step-by-step (owner actions, ~30 min + review wait)

1. **MSG91 account** — sign up at https://msg91.com with the business email;
   complete KYC with the registered business name, PAN, and GST (spec §6.2.9).
2. **DLT entity registration** — in the MSG91 console open *DLT → Entity
   Registration* and submit:
   - Entity name (exactly as registered — must match PAN/GST records),
   - PAN + GST certificate, CIN/LLPIN if applicable,
   - Contact email/phone for the DLT portal (VIL/BSL/JIO DLT portal account
     is created on your behalf by MSG91 where supported).
3. **Headers (sender IDs)** — request transactional headers per use; format
   is usually 6 alpha chars derived from the entity name (e.g. `MOMNTS`).
4. **Template registration** — copy the drafts below, adjusting
   `{variables}`; submit each as *Transactional* category. Keep variable
   syntax `##var1##` style per the portal.
5. **Approval tracking** — note the template IDs returned by the DLT portal;
   paste them into `packages/config` (SMS template registry) when F7 SMS
   sending lands.
6. **Post-approval** — configure the approved header + templates in the MSG91
   campaign/SMS API settings and store `MSG91_AUTH_KEY` in Doppler.

## Template drafts (ready to submit)

Variables: `##var1##` = user first name, `##var2##` = 6-digit OTP.

### T1 — OTP (English, transactional)

```
Dear ##var1##, your Moments verification code is ##var2##. It is valid for 10 minutes. Do not share this code with anyone. - MOMNTS
```

### T2 — OTP (Hindi, transactional)

```
प्रिय ##var1##, आपका Moments सत्यापन कोड ##var2## है। यह 10 मिनट के लिए मान्य है। इस कोड को किसी के साथ साझा न करें। - MOMNTS
```

### T3 — Login notification (English, transactional)

```
Dear ##var1##, you have successfully signed in to Moments on a new device. If this was not you, please secure your account immediately. - MOMNTS
```

## Notes

- Keep the fixed suffix `- MOMNTS` so recipients can identify the brand; the
  header should match the registered sender ID.
- Do **not** add promotional content to transactional templates — DLT
  operators reject mixed-purpose templates.
- Status of this checklist: **pending owner submission** (KAN-101).
