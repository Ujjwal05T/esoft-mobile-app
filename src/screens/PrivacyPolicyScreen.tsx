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

export default function PrivacyPolicyScreen() {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Privacy Policy – Parts Now</Text>
        <Text style={styles.pageSubtitle}>Last updated: 06 February 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.body}>
          This Privacy Policy describes how ESOFT AUTO PRIVATE LIMITED,
          operating the Platform under the brand name "Parts Now" ("Parts Now",
          "Company", "we", "our", "us"), collects, uses, shares, protects, or
          otherwise processes your information/personal data through our website
          and mobile application ("Platform").
        </Text>
        <Text style={styles.body}>
          You may be able to browse certain sections of the Platform without
          registering with us; however, some features and services will require
          registration and/or the provision of certain information. We do not
          offer any product/service under this Platform outside India, and your
          personal data will primarily be stored and processed in India, subject
          to applicable laws.
        </Text>
        <Text style={styles.body}>
          By visiting or using this Platform, providing your information, or
          availing any product/service offered on the Platform, you expressly
          agree to be bound by the terms and conditions of this Privacy Policy,
          the Terms of Use, and any applicable product/service terms, and agree
          to be governed by the laws of India, including but not limited to laws
          relating to data protection and privacy. If you do not agree, please
          do not use or access our Platform.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.body}>
          We collect personal data when you use our Platform, our services, or
          otherwise interact with us during the course of our relationship. This
          includes information you provide directly and information collected
          automatically when you use our services.
        </Text>

        <Text style={styles.subSectionTitle}>2.1 Information You Provide</Text>
        <Text style={styles.body}>Examples include, but are not limited to:</Text>
        <BulletItem text="Identity and contact details: Name, business/workshop name, address, GSTIN, email address, mobile/telephone number, and similar details required to create and maintain your account and workshop profile." />
        <BulletItem text="Account and profile information: Username/login ID, password, role within the workshop, preferences, and settings." />
        <BulletItem text="KYC and verification information: Documents or information provided as proof of identity or address (such as PAN, Aadhaar, business registration certificates), as may be required under applicable laws and/or by our payment/financial partners." />
        <BulletItem text="Payment and billing information: Bank account details, UPI ID, card details or other payment instrument information (collected, where applicable, via secure payment partners), billing address, and related transaction details." />
        <BulletItem text="Business and operational data: Vehicle/job records, details of service jobs, orders placed, frequently ordered items, notes you enter into the workshop dashboard, and data you input into the garage management software for day-to-day operations." />
        <BulletItem text="Communications and support: Information you provide when you contact us by email, phone, chat, or other channels, including support requests, feedback, survey responses, and, where permitted by law, call recordings." />

        <Text style={styles.subSectionTitle}>2.2 Sensitive Personal Data</Text>
        <Text style={styles.body}>
          With your consent, where required by law, we may also collect and
          process certain sensitive personal data:
        </Text>
        <BulletItem text="Financial information: Bank account details, card numbers or other payment instrument details necessary for processing payments and refunds." />
        <BulletItem text="Biometric/physiological information: Voice samples and images (e.g., photos of vehicles, parts, number plates) and related data you provide when using AI-powered features." />

        <Text style={styles.subSectionTitle}>
          2.3 Information Collected Automatically
        </Text>
        <Text style={styles.body}>
          When you visit or use the Platform, we may automatically collect:
        </Text>
        <BulletItem text="Device identifiers, device type, operating system, browser type, app version" />
        <BulletItem text="IP address, approximate location, timestamps, and language settings" />
        <BulletItem text="Usage information such as pages/screens visited, features used, time spent, clickstream data" />
        <BulletItem text="Log data and diagnostic information" />

        <Text style={styles.subSectionTitle}>
          2.4 Information from Third Parties
        </Text>
        <Text style={styles.body}>
          We may receive information about you from payment gateways, banks,
          logistics partners, OEMs, and marketing partners. When a third-party
          partner collects your personal data directly from you, their own
          privacy policy will apply.
        </Text>

        <Text style={styles.subSectionTitle}>2.5 Fraud and Phishing Alerts</Text>
        <Text style={styles.body}>
          We will never contact you to ask for your card PIN, net-banking or
          mobile banking password, UPI PIN, or full OTP. If you receive any
          such request claiming to be from Parts Now or Esoft, do not share
          this information and immediately contact your bank/payment provider.
        </Text>

        <Text style={styles.sectionTitle}>
          3. AI-Powered Features and Voice/Image Data
        </Text>
        <Text style={styles.body}>
          The Platform provides several AI-powered tools designed to simplify
          parts ordering and workshop operations including voice-based ordering,
          number-plate-based vehicle lookup, and image-based part detection.
        </Text>
        <Text style={styles.body}>
          To enable these features, we may process voice recordings, images, and
          technical metadata. You can choose not to use these AI features and
          instead rely on manual search and ordering.
        </Text>

        <Text style={styles.sectionTitle}>4. How We Use Your Information</Text>
        <BulletItem text="Service delivery and operations" />
        <BulletItem text="Transaction processing" />
        <BulletItem text="Logistics and order fulfilment" />
        <BulletItem text="Customer support and communication" />
        <BulletItem text="Personalisation and improvements" />
        <BulletItem text="Marketing and promotions" />
        <BulletItem text="Security, fraud prevention, and legal compliance" />

        <Text style={styles.sectionTitle}>5. How We Share Your Information</Text>
        <Text style={styles.body}>
          We do not sell your personal data. We may share your data with group
          entities, service providers, business partners, and for
          legal/regulatory reasons as described in this policy.
        </Text>

        <Text style={styles.sectionTitle}>6. Security Measures</Text>
        <Text style={styles.body}>
          We adopt reasonable security practices including encryption, access
          controls, and regular security assessments. However, no system is
          completely secure. You are responsible for safeguarding your login
          credentials.
        </Text>

        <Text style={styles.sectionTitle}>7. Data Retention and Deletion</Text>
        <Text style={styles.body}>
          We retain your personal data as long as necessary for the purposes for
          which it was collected or as required by law. You may request account
          deletion, subject to certain limitations.
        </Text>

        <Text style={styles.sectionTitle}>8. Your Rights and Choices</Text>
        <Text style={styles.body}>
          Subject to applicable law, you may have rights including access,
          correction, deletion, restriction, and AI-specific choices regarding
          your personal data.
        </Text>

        <Text style={styles.sectionTitle}>
          9. Consent and Withdrawal of Consent
        </Text>
        <Text style={styles.body}>
          By using the Platform, you consent to the collection and processing of
          your data as described. You may withdraw consent by contacting our
          Grievance Officer.
        </Text>

        <Text style={styles.sectionTitle}>10. Third-Party Sites and Services</Text>
        <Text style={styles.body}>
          The Platform may contain links to third-party websites. We are not
          responsible for their privacy practices and encourage you to review
          their policies.
        </Text>

        <Text style={styles.sectionTitle}>
          11. Changes to This Privacy Policy
        </Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. Updated versions
          will be posted with an updated "Last updated" date. Your continued use
          constitutes acceptance of changes.
        </Text>

        <Text style={styles.sectionTitle}>
          12. Contact and Grievance Redressal
        </Text>
        <View style={styles.contactBox}>
          <Text style={styles.contactText}>
            <Text style={styles.contactLabel}>Grievance Officer: </Text>
            Anil Shah
          </Text>
          <Text style={styles.contactText}>
            <Text style={styles.contactLabel}>Company: </Text>
            ESOFT AUTO PRIVATE LIMITED (Parts Now)
          </Text>
          <Text style={styles.contactText}>
            <Text style={styles.contactLabel}>Email: </Text>
            esoftauto@gmail.com
          </Text>
          <Text style={styles.contactText}>
            <Text style={styles.contactLabel}>Address: </Text>
            Plot no. 420, New Loha Mandi, Scheme no. 78, Phase 2, NIRANJANPUR,
            DEWAS NAKA, INDORE, MADHYA PRADESH 452010, India
          </Text>
          <Text style={styles.contactNote}>
            We will endeavour to acknowledge and respond to your concerns within
            the timelines prescribed under applicable law.
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
