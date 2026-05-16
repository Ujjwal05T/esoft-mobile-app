import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BulletItem = ({text}: {text: string}) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bullet}>{'•'}</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

export default function RefundPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refund Policy</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>
          Refund, Return and Cancellation Policy – Parts Now
        </Text>
        <Text style={styles.pageSubtitle}>Last updated: 06 February 2026</Text>

        <Text style={styles.body}>
          This Refund, Return and Cancellation Policy ("Policy") applies to all
          orders placed by workshop and garage customers ("you", "your") on the
          Parts Now platform, owned and operated by ESOFT AUTO PRIVATE LIMITED
          ("Company", "we", "us", "our"). This Policy must be read together
          with the Terms of Use and Privacy Policy.
        </Text>
        <Text style={styles.body}>
          By placing an order or approving a quote on the Platform, you agree to
          this Policy.
        </Text>

        <Text style={styles.sectionTitle}>
          1. Nature of Business and General Principles
        </Text>
        <Text style={styles.body}>
          Parts Now is a B2B platform serving workshops and garages.
        </Text>
        <Text style={styles.body}>
          Most parts are vehicle-specific and procured against your confirmed
          approval from OEMs or authorised distributors.
        </Text>
        <Text style={styles.body}>Therefore:</Text>
        <BulletItem text="No cancellation is possible once a quote is approved and paid by the workshop." />
        <BulletItem text="Returns and replacements are not automatic and are allowed only after our thorough inspection and verification of the goods and issues raised." />

        <Text style={styles.sectionTitle}>2. Cancellation Policy</Text>

        <Text style={styles.subSectionTitle}>
          2.1 No Cancellation After Approval and Payment
        </Text>
        <Text style={styles.body}>
          Every order is based on a quote shared with the workshop, detailing
          prices, taxes, charges, and terms.
        </Text>
        <Text style={styles.body}>
          Once you approve the quote and make payment, the order becomes final,
          confirmed, and non-cancellable.
        </Text>
        <Text style={styles.body}>After this point:</Text>
        <BulletItem text="You cannot cancel the order (fully or partially)." />
        <BulletItem text="You cannot change part numbers, quantities, or delivery details for that order." />

        <Text style={styles.subSectionTitle}>2.2 Cancellation by Parts Now</Text>
        <Text style={styles.body}>
          We may cancel an order (in whole or in part) only in exceptional
          cases, such as:
        </Text>
        <BulletItem text="Non-availability of stock or discontinuation by OEM/distributor." />
        <BulletItem text="Major errors in pricing/description." />
        <BulletItem text="Regulatory or compliance issues." />
        <Text style={styles.body}>
          If we cancel such an order or part of an order, any amount paid for
          the cancelled items will be refunded to the original payment method,
          subject to the timelines of your bank/payment provider (see Section 5).
        </Text>

        <Text style={styles.sectionTitle}>
          3. Raising Returns, Disputes and Goodwill Requests
        </Text>

        <Text style={styles.subSectionTitle}>
          3.1 24-Hour Formal Intimation Requirement
        </Text>
        <Text style={styles.body}>
          For any issues relating to:
        </Text>
        <BulletItem text="Wrong item supplied," />
        <BulletItem text="Physical damage in transit," />
        <BulletItem text="Manufacturing defects noticed on delivery, or" />
        <BulletItem text="Short supply," />
        <Text style={styles.body}>
          you must formally raise a request within 24 hours of delivery.
        </Text>
        <Text style={styles.body}>
          You can raise this request through any of the following channels:
        </Text>
        <BulletItem text="Parts Now App/Portal – via the order/issue section." />
        <BulletItem text="WhatsApp – on the officially communicated Parts Now support number." />
        <BulletItem text="Phone call – to the Parts Now team on the support number." />
        <Text style={styles.body}>When raising a request, you must share:</Text>
        <BulletItem text="Order ID and invoice number." />
        <BulletItem text="Clear photos/videos of the part, packaging, labels and damage/defect (if any)." />
        <BulletItem text="A brief description of the issue." />
        <Text style={styles.body}>
          Requests raised after 24 hours from delivery will normally not be
          eligible for return or replacement, except where we expressly allow it
          as a goodwill case at our sole discretion.
        </Text>

        <Text style={styles.subSectionTitle}>
          3.2 Investigation and Inspection
        </Text>
        <Text style={styles.body}>
          Once your request is registered, our team will:
        </Text>
        <BulletItem text="Validate the details and evidence shared, and" />
        <BulletItem text="Decide whether physical inspection/pick-up is required." />
        <Text style={styles.body}>We may:</Text>
        <BulletItem text="Arrange pickup of the goods, or" />
        <BulletItem text="Ask you to hold the goods for inspection at your workshop, or" />
        <BulletItem text="Direct you to ship back to a specified address (on our or your cost, depending on the case)." />
        <Text style={styles.body}>
          All returned goods will undergo thorough inspection, which may include:
        </Text>
        <BulletItem text="Verifying part numbers vs. the approved quote/invoice." />
        <BulletItem text="Checking for signs of use, installation, or mishandling." />
        <BulletItem text="Assessing the claimed damage/defect or mismatch." />
        <Text style={styles.body}>
          Only if our investigation confirms that the issue falls within our
          replacement/refund clauses (for example, wrong supply, genuine
          manufacturing defect, or transit damage not caused by workshop
          handling) will the case be treated as an approved return/replacement
          case.
        </Text>

        <Text style={styles.subSectionTitle}>3.3 Goodwill Returns</Text>
        <Text style={styles.body}>
          In certain situations where there is no clear fault on our side (for
          example, wrong ordering by workshop, change of job requirement), we
          may allow a return as a goodwill gesture, subject to:
        </Text>
        <BulletItem text="Our internal approval," />
        <BulletItem text="OEM/distributor acceptance, and" />
        <BulletItem text="Condition of the part and packaging." />
        <Text style={styles.body}>Goodwill returns are:</Text>
        <BulletItem text="Not a right, they are purely discretionary." />
        <BulletItem text="Subject to possible restocking/handling charges and deduction of logistics costs." />
        <BulletItem text="Always dependent on parts being unused, uninstalled and in fully saleable, original condition." />

        <Text style={styles.sectionTitle}>
          4. Return Eligibility and Non-Returnable Items
        </Text>

        <Text style={styles.subSectionTitle}>
          4.1 Eligible Scenarios (Subject to Approval)
        </Text>
        <Text style={styles.body}>
          You may be considered for return/replacement if, and only if, after
          inspection we confirm:
        </Text>
        <BulletItem text="Wrong part supplied compared to the approved quote/invoice." />
        <BulletItem text="Damaged goods due to transit or handling before delivery to you." />
        <BulletItem text="Manufacturing defects identified immediately on delivery and before installation." />
        <BulletItem text="Short shipment (less quantity delivered vs. invoice)." />
        <Text style={styles.body}>
          All such cases must be reported within 24 hours of delivery as
          described above.
        </Text>

        <Text style={styles.subSectionTitle}>
          4.2 Non-Returnable / Strictly-Controlled Items
        </Text>
        <Text style={styles.body}>
          The following will generally not be accepted for return, except in
          clearly proven wrong-supply or transit-damage cases and still subject
          to inspection:
        </Text>
        <BulletItem text="Electrical/electronic components (ECUs, sensors, wiring kits, control modules, etc.)." />
        <BulletItem text="Special-order / indented items procured specifically for your vehicle/job." />
        <BulletItem text="Parts that have been installed, fitted, used, or modified." />
        <BulletItem text="Opened or partially used oils, fluids, and consumables." />
        <BulletItem text="Items without original OEM/brand packaging, labels or with tampered seals." />

        <Text style={styles.sectionTitle}>5. Refunds</Text>

        <Text style={styles.subSectionTitle}>5.1 When Refunds Are Issued</Text>
        <Text style={styles.body}>
          Refunds may be issued only in the following situations:
        </Text>
        <BulletItem text="Order cancellations by Parts Now (e.g., due to non-availability)." />
        <BulletItem text="Approved returns where replacement is not possible, or you do not wish to opt for a replacement and we consider a refund appropriate." />
        <BulletItem text="Billing/quantity adjustments (over-charges or short supplies) confirmed by our team." />

        <Text style={styles.subSectionTitle}>5.2 Mode of Refund</Text>
        <Text style={styles.body}>
          Refunds will be processed back to the original payment source used for
          the order, where technically possible (e.g., same UPI ID / card / net
          banking account).
        </Text>
        <Text style={styles.body}>
          In special or technical cases where refund to original method is not
          possible, we may process refund via an alternate method or as credit
          balance in your Parts Now account, after consulting with you.
        </Text>

        <Text style={styles.subSectionTitle}>5.3 Refund Timelines</Text>
        <BulletItem text="Once a refund is approved (post-investigation/inspection), we typically initiate the refund within 3–5 business days." />
        <BulletItem text="Actual credit to your account depends on your bank/payment provider and may take an additional 3–7 business days." />
        <BulletItem text="You will be informed when the refund is initiated." />

        <Text style={styles.subSectionTitle}>5.4 Deductions and Charges</Text>
        <Text style={styles.body}>
          For cases where Parts Now is at fault (confirmed wrong supply,
          confirmed damage before delivery, confirmed short supply):
        </Text>
        <BulletItem text="Refunds will typically be made in full, including standard shipping charges for the affected item(s)." />
        <Text style={styles.body}>
          For goodwill returns or cases where the issue is not due to our fault:
        </Text>
        <BulletItem text="We may deduct reasonable restocking/handling fee, and applicable logistics/shipping costs for return pickup and/or original delivery." />
        <Text style={styles.body}>
          Any deductions will be communicated to you before finalising the
          refund.
        </Text>

        <Text style={styles.sectionTitle}>
          6. OEM Warranty and Insurance Cases
        </Text>
        <Text style={styles.body}>
          Some parts may carry OEM/manufacturer warranties, which are governed
          entirely by the OEM/manufacturer terms.
        </Text>
        <Text style={styles.body}>
          Warranty claims (if applicable) may require:
        </Text>
        <BulletItem text="Proof of purchase," />
        <BulletItem text="Proper installation at authorised workshops, and" />
        <BulletItem text="Inspection by OEM/manufacturer or their representatives." />
        <Text style={styles.body}>
          For insurance-linked or accidental repair jobs, any return or claim is
          also subject to insurer and OEM policies, and timelines may be longer
          due to mandatory checks.
        </Text>
        <Text style={styles.body}>
          Where a warranty/insurance claim results in a refund/replacement from
          OEM/insurer through us, the corresponding benefit will be passed on to
          you, typically via replacement or refund to original source (or as
          otherwise agreed in that specific case).
        </Text>

        <Text style={styles.sectionTitle}>7. Dispute Resolution</Text>
        <Text style={styles.body}>
          Any disputes arising out of or in connection with cancellations,
          returns, goodwill decisions, inspections, or refunds will be governed
          by Indian law.
        </Text>
        <Text style={styles.body}>
          The courts at Indore, Madhya Pradesh, India will have exclusive
          jurisdiction over all such disputes.
        </Text>
        <Text style={styles.body}>
          Our decision on each case is taken after reasonable investigation and
          inspection and will be final and binding, subject to your rights under
          applicable law.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact</Text>
        <Text style={styles.body}>
          For all queries or requests related to cancellations, returns,
          inspections, goodwill requests, or refunds, please contact:
        </Text>
        <View style={styles.contactBox}>
          <Text style={styles.contactText}>
            <Text style={styles.contactLabel}>
              ESOFT AUTO PRIVATE LIMITED (Parts Now)
            </Text>
          </Text>
          <Text style={styles.contactText}>
            <Text style={styles.contactLabel}>Email: </Text>
            anilshah@etnagroup.in
          </Text>
          <Text style={styles.contactNote}>
            Please include your workshop name, order ID, and invoice number in
            all communications, along with photos/videos where relevant.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e5383b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    marginTop: 8,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 14,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 4,
  },
  bullet: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  contactBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 4,
  },
  contactLabel: {
    fontWeight: '600',
  },
  contactNote: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 20,
  },
});
