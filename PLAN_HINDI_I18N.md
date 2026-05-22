# Hindi (Multi-Language) Support — Implementation Plan

## Overview

Add i18n support to the Esoft React Native app, starting with Hindi, using
`i18next` + `react-i18next`. The app already has a `LanguageSelectionScreen`
that saves the user's choice to AsyncStorage — this plan wires that into a real
translation system.

---

## Phase 1 — Foundation Setup

### 1.1 Install Dependencies

```
npm install i18next react-i18next react-native-localize @react-native-async-storage/async-storage
```

`react-native-localize` detects the device locale for the default language.
`@react-native-async-storage/async-storage` is likely already installed (used by
`LanguageSelectionScreen`) — confirm before re-installing.

### 1.2 Create i18n Directory Structure

```
src/
  i18n/
    index.ts          ← i18next setup + language init
    locales/
      en.json         ← all English strings (source of truth)
      hi.json         ← all Hindi translations
```

### 1.3 i18n Setup (`src/i18n/index.ts`)

- Initialize i18next with `en` as fallback language
- On startup: read saved language from AsyncStorage (`@app_selected_language`)
- If nothing saved: use `react-native-localize` device locale, fall back to `en`
- Export `changeLanguage(lang)` helper used by `LanguageSelectionScreen`

### 1.4 Wire into App Entry Point

- Wrap `App.tsx` root with `I18nextProvider`
- Initialize i18n before first render (use `Suspense` or an async init pattern)

---

## Phase 2 — Wire LanguageSelectionScreen

`LanguageSelectionScreen` already saves to AsyncStorage. Changes needed:
- After saving, call `changeLanguage(lang)` from `src/i18n/index.ts`
- The rest of the app re-renders with the new language automatically

Supported languages in the screen (already listed in UI):
| Code | Language    | Script      |
|------|-------------|-------------|
| en   | English     | Latin       |
| hi   | Hindi       | Devanagari  |
| pa   | Punjabi     | Gurmukhi    |
| mr   | Marathi     | Devanagari  |
| gu   | Gujarati    | Gujarati    |
| ur   | Urdu        | Nastaliq    |
| ta   | Tamil       | Tamil       |
| ml   | Malayalam   | Malayalam   |
| mwr  | Marwari     | Devanagari  |

**For this plan we only populate `en.json` and `hi.json`.** Other language JSON
files can be added later as empty objects and filled incrementally.

---

## Phase 3 — Font Support

Hindi (Devanagari) renders fine on system fonts (Android & iOS). However:

- If the app uses a custom English font via `fontFamily` in StyleSheet, Devanagari
  characters may not render correctly with that font.
- **Action**: Add `NotoSansDevanagari-Regular.ttf` and
  `NotoSansDevanagari-Bold.ttf` to `android/app/src/main/assets/fonts/` and
  `ios/` (via Xcode). Run `npx react-native-asset` to link.
- In StyleSheet, only apply the custom English font when `i18n.language === 'en'`,
  otherwise let the system font handle it, OR use Noto Sans for all languages.

---

## Phase 4 — String Extraction (Screen by Screen)

Extract all hardcoded user-facing strings into `en.json` and add Hindi
translations in `hi.json`. In each file, replace the string with `t('key')`.

Use a flat namespaced key structure:
```json
{
  "common.save": "Save",
  "common.cancel": "Cancel",
  "auth.login_title": "Login",
  "vehicle.add_plate": "Add by Car Number Plate"
}
```

### 4.1 Common / Shared Strings  
**File:** `src/i18n/locales/en.json` (common section)  
These appear across multiple screens:

| Key | English |
|-----|---------|
| `common.save` | Save |
| `common.cancel` | Cancel |
| `common.back` | Back |
| `common.submit` | Submit |
| `common.loading` | Loading... |
| `common.retry` | Retry |
| `common.optional` | Optional |
| `common.skip` | Skip |
| `common.next` | NEXT |
| `common.done` | Done |
| `common.edit` | Edit |
| `common.delete` | Delete |
| `common.confirm` | Confirm |
| `common.success` | Success |
| `common.error` | Error |
| `common.warning` | Warning |
| `common.active` | Active |
| `common.inactive` | Inactive |
| `common.status` | Status |
| `common.search` | Search |
| `common.no_data` | No data found |

**Components:** `AppAlert`, `CustomTabBar`, `MobileSidebar`

### 4.2 Authentication Screens  
**Files:** `LoginScreen.tsx`, `RegisterScreen.tsx`

| Key | English |
|-----|---------|
| `auth.email` | Email |
| `auth.phone` | Phone |
| `auth.login_title` | Login |
| `auth.register_title` | Register |
| `auth.email_placeholder` | Enter Email Address |
| `auth.phone_placeholder` | Enter Mobile Number |
| `auth.otp_email_hint` | We'll send you a 6-digit OTP to verify your email |
| `auth.otp_whatsapp_hint` | We'll send you a 6-digit OTP on WhatsApp |
| `auth.verify_otp` | Verify OTP |
| `auth.no_account` | Don't have an account? |
| `auth.register_link` | Register |
| `auth.email_error` | Enter a valid email address |
| `auth.phone_error` | Enter a valid 10-digit mobile number starting with 6-9 |

### 4.3 Navigation / Tab Bar  
**File:** `CustomTabBar.tsx`, `MobileSidebar.tsx`

| Key | English |
|-----|---------|
| `nav.home` | Home |
| `nav.vehicles` | Vehicle |
| `nav.orders` | Orders |
| `nav.inquiry` | Inquiry |
| `nav.staff` | My Staff |
| `nav.reports` | Generate Reports |
| `nav.faqs` | FAQs |
| `nav.policies` | Policies |
| `nav.logout` | Logout |
| `nav.profile` | Profile |

### 4.4 Vehicle Screens  
**Files:** `VehicleScreen.tsx`, `VehicleDetailScreen.tsx`, `StaffVehicleScreen.tsx`,
`StaffVehicleDetailScreen.tsx`

| Key | English |
|-----|---------|
| `vehicle.title` | Vehicles |
| `vehicle.add_plate` | Add by Car Number Plate |
| `vehicle.add_manually` | Add Vehicle Manually |
| `vehicle.scan_rc` | Scan RC Card |
| `vehicle.plate_placeholder` | MP 09 GL 5656 |
| `vehicle.brand` | Brand |
| `vehicle.model` | Model |
| `vehicle.year` | Year |
| `vehicle.variant` | Select Variant |
| `vehicle.vehicle_number` | Vehicle Number |
| `vehicle.chassis_number` | Chassis Number |
| `vehicle.rc_images` | RC Card Images (Optional) |
| `vehicle.rc_front` | RC Front (Optional) |
| `vehicle.rc_back` | RC Back (Optional) |
| `vehicle.gate_in` | GATE IN |
| `vehicle.owner_info` | Add Owner Info (Optional) |
| `vehicle.registration_name` | Registration Name |
| `vehicle.owner_name` | Owner Name |
| `vehicle.contact_number` | Contact Number |
| `vehicle.driver_name` | Driver's Name |
| `vehicle.driver_contact` | Driver's Contact Number |
| `vehicle.odometer` | Odometer Reading |
| `vehicle.fuel_reading` | Fuel Reading |
| `vehicle.problem_shared` | Problem Shared (Optional) |
| `vehicle.gate_in_datetime` | Gate In Date and Time |
| `vehicle.proceed_gate_in` | PROCEED TO GATE IN |
| `vehicle.manual_error` | Enter chassis number, or fill in vehicle number + brand/model/year/variant |

### 4.5 Orders / Quotes  
**Files:** `OrdersScreen.tsx`, `OrderDetailScreen.tsx`, `QuoteDetailScreen.tsx`

| Key | English |
|-----|---------|
| `orders.title` | Orders |
| `orders.grand_total` | Grand Total |
| `orders.parts_subtotal` | Parts Subtotal |
| `orders.delivery_by` | Delivery by: |
| `orders.payment` | Payment |
| `orders.select_payment` | Select Payment Method |
| `orders.credit_debit` | CREDIT / DEBIT CARD |
| `orders.net_banking` | NET BANKING |
| `orders.status_shipped` | Shipped |
| `orders.status_delivered` | Delivered |
| `orders.status_in_process` | In Process |
| `orders.status_requested` | Requested |
| `orders.loading` | Loading payment details... |
| `orders.quote_not_found` | Quote not found |

### 4.6 Inquiry / Dispute Screens  
**Files:** `InquiryScreen.tsx`, `InquiryDetailScreen.tsx`, `StaffInquiryScreen.tsx`,
`RaiseDisputeOverlay.tsx`

| Key | English |
|-----|---------|
| `inquiry.title` | Inquiries |
| `inquiry.raise_dispute` | Raise a Dispute |
| `inquiry.unassigned` | Unassigned |

### 4.7 Staff Screens  
**Files:** `StaffScreen.tsx`, `StaffProfileScreen.tsx`

| Key | English |
|-----|---------|
| `staff.title` | My Staff |
| `staff.name` | Name |
| `staff.role` | Role |
| `staff.email` | Email |
| `staff.phone` | Phone |

### 4.8 Profile Screen  
**File:** `ProfileScreen.tsx`

| Key | English |
|-----|---------|
| `profile.title` | Profile |
| `profile.edit` | Edit Profile |
| `profile.language` | Language |

### 4.9 Estimate / PDF Overlay  
**File:** `EstimationOverlay.tsx`

| Key | English |
|-----|---------|
| `estimate.title` | JOB ESTIMATE |
| `estimate.invoice_no` | Invoice # |
| `estimate.invoice_date` | Invoice Date |
| `estimate.due_date` | Due Date |
| `estimate.terms` | Terms |
| `estimate.bill_to` | Bill To |
| `estimate.ship_to` | Ship To |
| `estimate.item_desc` | Item & Description |
| `estimate.qty` | Qty |
| `estimate.rate` | Rate |
| `estimate.amount` | Amount |
| `estimate.sub_total` | Sub Total |
| `estimate.discount` | Discount |
| `estimate.total` | Total Payable |
| `estimate.balance_due` | Balance Due |
| `estimate.generate_pdf` | Generate PDF |
| `estimate.download` | Download |
| `estimate.share` | Share |

### 4.10 Info / Policy Screens  
**Files:** `FAQsScreen.tsx`, `PrivacyPolicyScreen.tsx`, `RefundPolicyScreen.tsx`,
`TermsAndConditionsScreen.tsx`, `PoliciesScreen.tsx`

These contain mostly **static long-form text** (policy documents). These are a
special case — full document translation is needed, not just key-value pairs.
**Strategy:** Store the full policy text as a multiline string per language key,
or load it from a locale-specific file.

---

## Phase 5 — Hindi Translations (`hi.json`)

Provide Hindi equivalents for all keys in `en.json`. Sample:

```json
{
  "common.save": "सहेजें",
  "common.cancel": "रद्द करें",
  "common.next": "आगे",
  "auth.email_placeholder": "ईमेल पता दर्ज करें",
  "vehicle.add_manually": "वाहन मैन्युअल रूप से जोड़ें",
  "vehicle.gate_in": "गेट इन",
  "nav.home": "होम",
  "nav.orders": "ऑर्डर",
  "nav.vehicles": "वाहन",
  "nav.inquiry": "पूछताछ",
  "orders.grand_total": "कुल राशि"
}
```

Full Hindi translation for all ~200 keys is part of this phase.

---

## Phase 6 — Date & Number Formatting

- **Dates**: Wrap all `toLocaleDateString` calls to pass `i18n.language` as the
  locale. Hindi uses the same Gregorian calendar, just translated month/day names.
- **Numbers / Currency**: Use `toLocaleString('hi-IN')` for currency amounts when
  language is Hindi. The `₹` symbol stays the same.
- **Existing `formatDateIST` utility**: Update it to accept an optional `locale`
  param.

---

## Phase 7 — Testing

- Test each screen in both English and Hindi by switching language
- Verify Devanagari font renders without truncation (increase `lineHeight` if text
  clips — Hindi characters have taller ascenders)
- Test long Hindi strings don't overflow button/card layouts
- Test AsyncStorage persistence — app should open in the same language after restart
- Test device-locale detection on a Hindi-locale Android device

---

## Execution Order

| Step | Task | Effort | Status |
|------|------|--------|--------|
| 1 | Install packages, create `src/i18n/index.ts`, wrap App | ~1 hr | ✅ Done |
| 2 | Wire `LanguageSelectionScreen` to `changeLanguage()` | 30 min | ✅ Done |
| 3 | Add Noto Sans Devanagari font | 30 min | ⏳ Pending |
| 4 | Extract + translate Common strings + AppAlert | 1 hr | ✅ Done |
| 5 | Auth screens | 1 hr | ✅ Done |
| 6 | Navigation (CustomTabBar, MobileSidebar) | 30 min | ✅ Done |
| 7 | Vehicle screens + AddVehicleOverlay | 2 hr | ✅ Done |
| 8 | Orders / Quotes screens | 1.5 hr | ✅ Done |
| 9 | EstimationOverlay | 1 hr | ✅ Done |
| 10 | Inquiry / Staff / Profile screens | 1.5 hr | ✅ Done |
| 11 | Info / Policy screens (long text) | 2 hr | ⏳ Pending |
| 12 | Date/Number formatting | 1 hr | ⏳ Pending |
| 13 | QA + layout fixes for Hindi text overflow | 2 hr | ⏳ Pending |
| **Total** | | **~15 hrs** | |

---

## Files That Will Change

### New Files
- `src/i18n/index.ts`
- `src/i18n/locales/en.json`
- `src/i18n/locales/hi.json`
- `android/app/src/main/assets/fonts/NotoSansDevanagari-Regular.ttf`
- `android/app/src/main/assets/fonts/NotoSansDevanagari-Bold.ttf`

### Modified Files
- `package.json` (new deps)
- `App.tsx` (i18n init + I18nextProvider wrap)
- `src/screens/LanguageSelectionScreen.tsx` (wire to changeLanguage)
- `src/screens/LoginScreen.tsx`
- `src/screens/RegisterScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/VehicleScreen.tsx`
- `src/screens/VehicleDetailScreen.tsx`
- `src/screens/StaffVehicleScreen.tsx`
- `src/screens/StaffVehicleDetailScreen.tsx`
- `src/screens/OrdersScreen.tsx`
- `src/screens/OrderDetailScreen.tsx`
- `src/screens/QuoteDetailScreen.tsx`
- `src/screens/InquiryScreen.tsx`
- `src/screens/InquiryDetailScreen.tsx`
- `src/screens/StaffScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/ReportsScreen.tsx`
- `src/screens/NotificationsScreen.tsx`
- `src/screens/FAQsScreen.tsx`
- `src/screens/PrivacyPolicyScreen.tsx`
- `src/screens/TermsAndConditionsScreen.tsx`
- `src/screens/RefundPolicyScreen.tsx`
- `src/components/overlays/AddVehicleOverlay.tsx`
- `src/components/overlays/EstimationOverlay.tsx`
- `src/components/overlays/RaiseDisputeOverlay.tsx`
- `src/components/dashboard/Header.tsx`
- `src/components/CustomTabBar.tsx`
- `src/components/layout/MobileSidebar.tsx`
- `src/components/overlays/AppAlert.tsx`
- `src/utils/formatDate.ts` (locale param)

---

## Notes

- **Policy screens**: Long-form content. Consider fetching locale-specific content
  from the backend rather than bundling it in JSON, to keep the app bundle small.
- **Urdu** (if added later) is RTL — would require `I18nManager.forceRTL(true)` and
  full layout mirroring. Do not add Urdu until RTL is explicitly planned.
- **API response data** (vehicle names, workshop names, part names, etc.) comes from
  the backend and is NOT translated by the frontend. If these need Hindi support
  too, that is a separate backend data concern.
