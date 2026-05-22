# i18n Audit — Hardcoded English Strings

Legend: ⬜ Not started · 🔄 In progress · ✅ Done · ⏭ Deferred

---

## Progress Summary

| Category | Done | Pending |
|---|---|---|
| Screens | 12 | 8 |
| Components / Overlays | 19 | 6 |
| **Total** | **31** | **14** |

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

### ⬜ HomeScreen.tsx
- `"Loading dashboard..."` — loading state
- `"Vehicles Assigned"` / `"Approved Inquiry"` — status card titles
- `"Select Vehicle for Parts Request"` — overlay title

---

### ⬜ VehicleScreen.tsx
- `"Loading vehicles..."` — loading state
- `"Try Again"` — error retry button
- `"No vehicles match your filters"` / `"No vehicles currently in workshop"` / `"No requested vehicles"` — empty state titles
- `"Try adjusting your filter criteria"` / `"Gate in a vehicle to see it here"` / `"Staff-added vehicles will appear here"` — empty subtitles
- `"Clear Filters"` — button
- `"All"` / `"Requested"` — tab labels
- `"Filter"` — filter button
- `"Add new vehicle"` — FAB option label

---

### ⬜ VehicleDetailScreen.tsx
- `"Loading vehicle details..."` — loading state
- `"Vehicle Not Found"` / `"The vehicle you're looking for doesn't exist."` / `"Go Back"` — error state
- `"Vehicle Details"` — screen title
- `"Basic Info"` — accordion title
- `"Make Year"` / `"Reg. Year"` / `"Chassis No."` / `"Fuel"` / `"Transmission"` / `"Variant"` / `"Owner Name"` / `"Contact"` / `"Odometer"` — info grid labels
- `"Problems Shared"` / `"No problems shared for this visit"` — accordion
- `"Previous Services"` / `"No previous visits"` / `"Create a new job card to get started"` — accordion
- `"Jobs"` / `"Loading jobs..."` / `"No jobs found"` — jobs accordion
- `"Job card"` / `"Quotes"` / `"Orders"` / `"Inquiry"` / `"Disputes"` — tab labels
- `"No Quotes Found"` / `"No quotes found for this vehicle"` — empty state
- `"No Orders Found"` / `"Orders for this vehicle will appear here"` — empty state
- `"No Inquiries Found"` / `"No inquiries found for this vehicle"` — empty state
- `"No Disputes Found"` / `"No disputes found for this vehicle"` — empty state
- `"Gate Out"` / `"Generate Estimate"` / `"Create New Job"` / `"Raise Dispute"` / `"Request Part"` — FAB options
- `"Delivery Details"` — section header
- `"LR/Tracking No."` / `"Bus/Delivery Service"` / `"Bus/Delivery Contact No."` / `"Delivery Driver Name"` / `"Delivery Driver Contact No."` — info labels
- `"Additional Charges (Packing + Forwarding + Shipping)"` — amount label

---

### ⬜ StaffVehicleScreen.tsx
- `"Loading vehicles..."` — loading state
- `"Try Again"` — error retry button
- `"No vehicles found"` / `"Add your first vehicle to get started"` — empty state
- `"Add Vehicle"` — empty state button
- `"Add new vehicle"` — FAB option label

---

### ⬜ StaffVehicleDetailScreen.tsx
- `"Loading vehicle details..."` — loading state
- `"Vehicle Not Found"` / `"The vehicle you're looking for doesn't exist."` / `"Go Back"` — error state
- `"Vehicle Details"` — screen title
- `"Basic Info"` / `"Problems Shared"` / `"Previous Services"` — accordion titles
- `"Make Year"` / `"Reg. Year"` / `"Chassis No."` / `"Fuel"` / `"Transmission"` / `"Variant"` / `"Owner Name"` / `"Contact"` / `"Odometer"` — info grid labels
- `"No problems shared for this visit"` / `"No previous visits"` / `"Create a new job card to get started"` — empty states
- `"Jobs"` / `"Job card"` / `"Inquiry"` / `"Disputes"` — tab labels
- `"Loading jobs..."` / `"No jobs found"` — jobs state
- `"No Inquiries Found"` / `"No inquiries found for this vehicle"` — empty state
- `"No Disputes Found"` / `"No disputes found for this vehicle"` — empty state
- `"Gate Out"` / `"Create New Job"` / `"Raise Dispute"` / `"Request Part"` — FAB options

---

### ⬜ OrdersScreen.tsx
- `"Loading orders..."` — loading state
- `"Try Again"` — error retry button
- `"No Orders Found"` / `"Your orders will appear here"` — empty state
- `"Request Part"` — FAB option
- `"Select Vehicle for Request Part"` — overlay title

---

### ⬜ StaffScreen.tsx
- `"Loading staff..."` — loading state
- `"Try again"` — error recovery button
- `"Active"` / `"Inactive"` — tab labels
- `"Search staff..."` — input placeholder
- `"No active staff found"` / `"No inactive staff found"` — empty titles
- `"Add staff members to get started"` / `"No inactive staff members"` — empty subtitles

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

### ⬜ RaiseDisputeOverlay.tsx
- `"Raise Dispute"` — header title
- `"Order ID"` — floating label
- `"Select Part"` / `"Please select an order first"` / `"No parts available for this order"` — dropdown
- `"Please select a part"` / `"Please enter order ID"` / `"Please select a reason"` — validation errors
- `"Select Reason"` — dropdown placeholder
- `"Remark"` / `"Remark (Optional)"` — floating label / placeholder
- `"Press To Record Audio"` / `"Stop Recording..."` / `"Re-record Audio"` — record button states
- `"Audio recorded"` — audio chip label
- `"REQUEST SENT"` — success overlay text
- `"ADD DISPUTE PHOTO"` — image picker title

---

### ⬜ AddStaffOverlay.tsx
- `"Add Staff"` — modal header title
- `"Name"` / `"Role"` / `"Job Category"` / `"Contact Number"` / `"Email"` / `"Address"` — floating labels
- `"Permissions"` — section header
- `"Vehicle Approvals"` / `"Inquiry Approvals"` / `"Generate Estimates"` / `"Create Job Card"` / `"Dispute Approvals"` / `"Quote Approvals/Payments"` / `"Add Vehicle"` / `"Raise Dispute"` / `"Create Inquiry"` — permission labels
- `"ADD STAFF"` — submit button
- `"MANAGE PERMISSIONS"` — link button
- `"Add Staff Photo"` — image picker title

---

### ⬜ EditInquiryOverlay.tsx
- `"Edit Parts"` — header title
- `"Part Name"` / `"Preferred Brand"` / `"Brand Name"` / `"Quantity"` / `"Remark"` — floating labels
- `"Part name is required"` / `"Brand is required"` / `"Quantity is required"` — validation errors
- `"Remark (Optional)"` — placeholder
- `"Record"` / `"Recording..."` — audio button states
- `"ADD ANOTHER PART"` / `"SAVE CHANGES"` — buttons
- `"Add Photo"` — image picker title

---

### ⬜ NewJobCardOverlay.tsx
- `"New Job Card"` — header title
- `"Job Category"` / `"Assign Staff"` / `"Remark"` — floating labels
- `"No staff available"` — empty state
- `"Remark (Optional)"` — placeholder
- `"Record"` / `"Recording..."` — audio button states
- `"ADD JOB"` — submit button
- `"JOB CARD ADDED"` — success text
- `"Add New Staff"` — link button
- `"Add Photo"` — image picker title
- `"Audio"` — media card label

---

### ⬜ RequestPartOverlay.tsx
- `"Request by Part\nNumber / Scanning\nPart"` — search screen title
- `"Request\nPart\nManually"` — card title
- `"Request Parts"` — form header title
- `"Part Name"` / `"Preferred Brand"` / `"Quantity"` — floating labels
- `"Part Number (Optional)"` / `"Preferred Brand Name (if any)"` / `"Audio or Remark (Optional)"` — placeholders
- `"Please add part name"` / `"Please select preferred brand"` / `"Please add quantity"` — validation errors
- `"Record"` / `"Recording..."` — audio button states
- `"ADD ANOTHER PART"` — button
- `"SEND REQUEST"` — submit button
- `"REQUEST SENT"` — success text
- `"Add Part Photo"` — image picker title

---

### ⬜ VehicleSelectionOverlay.tsx
- `"Select Vehicle"` — header title
- `"Type at least 2 characters to search active vehicles"` — hint text
- `"Active"` — badge text
- `"No active vehicles found"` — empty state title
- `"No vehicles matching... are currently in the workshop"` — empty state subtitle
- `"Tap to select"` — hint text

---

## Deferred Phases

| Phase | Description | Status |
|---|---|---|
| Phase 3 | Noto Sans Devanagari font integration | ⬜ |
| Phase 12 | Date / number formatting (`Intl`, `date-fns`) | ⏭ (later) |
| Phase 13 | QA + layout fixes (RTL, text overflow, wrapping) | ⬜ |
