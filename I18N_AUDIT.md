# i18n Audit — Hardcoded English Strings

Legend: ⬜ Not started · 🔄 In progress · ✅ Done · ⏭ Deferred

---

## Progress Summary

| Category | Done | Pending |
|---|---|---|
| Screens | 19 | 0 |
| Components / Overlays | 25 | 0 |
| **Total** | **44** | **0** |

> **Session rules:** Skip date/time strings for now (Phase 12). Do one screen at a time.

---

## SCREENS

### ✅ OrderDetailScreen.tsx
### ✅ InquiryScreen.tsx
### ✅ InquiryDetailScreen.tsx
### ✅ StaffInquiryScreen.tsx
### ✅ ProfileScreen.tsx
### ✅ StaffProfileScreen.tsx
### ✅ QuoteDetailScreen.tsx
### ✅ PaymentScreen.tsx
### ✅ ReportsScreen.tsx
### ✅ NotificationsScreen.tsx
### ✅ FAQsScreen.tsx
### ✅ PoliciesScreen.tsx

---

### ✅ HomeScreen.tsx
### ✅ VehicleScreen.tsx
### ✅ VehicleDetailScreen.tsx
### ✅ StaffVehicleScreen.tsx
### ✅ StaffVehicleDetailScreen.tsx
### ✅ OrdersScreen.tsx
### ✅ StaffScreen.tsx

---

### ⏭ PrivacyPolicyScreen.tsx / TermsAndConditionsScreen.tsx / RefundPolicyScreen.tsx
Long-form static policy content — fetch from backend rather than bundle as translation strings.

---

## COMPONENTS / OVERLAYS

### ✅ TabNavigator.tsx
### ✅ OrderCard.tsx
### ✅ InquiryCard.tsx
### ✅ QuoteCard.tsx
### ✅ DisputeCard.tsx
### ✅ StaffCard.tsx
### ✅ JobCard.tsx
### ✅ VehicleCard.tsx
### ✅ AddStaffCard.tsx
### ✅ AddVehicleCard.tsx
### ✅ JobsCard.tsx
### ✅ RunningPartsCard.tsx
### ✅ RaisePartsCard.tsx
### ✅ StatusCard.tsx — no strings (props only)
### ✅ Header.tsx — no strings
### ✅ FloatingActionButton.tsx — no strings (props only)
### ✅ PreviousServiceCard.tsx — no strings (props only)
### ✅ EventCard.tsx — no strings (props only)
### ✅ ViewStaffOverlay.tsx
### ✅ EditStaffOverlay.tsx
### ✅ FiltersOverlay.tsx
### ✅ EditInquiryItemOverlay.tsx
### ✅ GateOutOverlay.tsx

---

### ✅ RaiseDisputeOverlay.tsx

---

### ✅ AddStaffOverlay.tsx
- `"Add Staff"` — modal header title
- `"Name"` / `"Role"` / `"Job Category"` / `"Contact Number"` / `"Email"` / `"Address"` — floating labels
- `"Permissions"` — section header
- `"Vehicle Approvals"` / `"Inquiry Approvals"` / `"Generate Estimates"` / `"Create Job Card"` / `"Dispute Approvals"` / `"Quote Approvals/Payments"` / `"Add Vehicle"` / `"Raise Dispute"` / `"Create Inquiry"` — permission labels
- `"ADD STAFF"` — submit button
- `"MANAGE PERMISSIONS"` — link button
- `"Add Staff Photo"` — image picker title

---

### ✅ EditInquiryOverlay.tsx

---

### ✅ NewJobCardOverlay.tsx

---

### ✅ RequestPartOverlay.tsx

---

### ✅ VehicleSelectionOverlay.tsx

---

## Deferred Phases

| Phase | Description | Status |
|---|---|---|
| Phase 3 | Noto Sans Devanagari font integration | ⬜ |
| Phase 12 | Date / number formatting (`Intl`, `date-fns`) | ⏭ (later) |
| Phase 13 | QA + layout fixes (RTL, text overflow, wrapping) | ⬜ |
