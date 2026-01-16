import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

// Import SVG icons
import InquiryIcon from '../assets/icons/inquiry.svg';

interface Inquiry {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  date: string;
  priority: 'low' | 'medium' | 'high';
}

const dummyInquiries: Inquiry[] = [
  {
    id: '1',
    title: 'Oil Change Request',
    description: 'Need oil change for Toyota Camry',
    status: 'pending',
    date: '2 hours ago',
    priority: 'medium',
  },
  {
    id: '2',
    title: 'Brake Inspection',
    description: 'Unusual noise from brakes',
    status: 'in-progress',
    date: '1 day ago',
    priority: 'high',
  },
  {
    id: '3',
    title: 'Tire Replacement',
    description: 'All four tires need replacement',
    status: 'resolved',
    date: '3 days ago',
    priority: 'low',
  },
  {
    id: '4',
    title: 'AC Repair',
    description: 'AC not cooling properly',
    status: 'pending',
    date: '5 hours ago',
    priority: 'medium',
  },
];

type TabType = 'all' | 'pending' | 'in-progress' | 'resolved';

const InquiryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const getStatusColor = (status: Inquiry['status']) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'in-progress':
        return '#3b82f6';
      case 'resolved':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: Inquiry['priority']) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const filteredInquiries =
    activeTab === 'all'
      ? dummyInquiries
      : dummyInquiries.filter(inquiry => inquiry.status === activeTab);

  const tabs: {key: TabType; label: string}[] = [
    {key: 'all', label: 'All'},
    {key: 'pending', label: 'Pending'},
    {key: 'in-progress', label: 'In Progress'},
    {key: 'resolved', label: 'Resolved'},
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inquiries</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Inquiry List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {filteredInquiries.map(inquiry => (
          <TouchableOpacity key={inquiry.id} style={styles.inquiryCard}>
            <View style={styles.inquiryHeader}>
              <View
                style={[
                  styles.priorityIndicator,
                  {backgroundColor: getPriorityColor(inquiry.priority)},
                ]}
              />
              <Text style={styles.inquiryTitle}>{inquiry.title}</Text>
            </View>
            <Text style={styles.inquiryDescription}>{inquiry.description}</Text>
            <View style={styles.inquiryFooter}>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: `${getStatusColor(inquiry.status)}15`},
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    {color: getStatusColor(inquiry.status)},
                  ]}>
                  {inquiry.status.charAt(0).toUpperCase() +
                    inquiry.status.slice(1).replace('-', ' ')}
                </Text>
              </View>
              <Text style={styles.inquiryDate}>{inquiry.date}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredInquiries.length === 0 && (
          <View style={styles.emptyState}>
            <InquiryIcon width={48} height={48} fill="#9ca3af" />
            <Text style={styles.emptyTitle}>No inquiries found</Text>
            <Text style={styles.emptySubtitle}>
              There are no inquiries in this category
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  tabsContent: {
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#e5383b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#e5383b',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  inquiryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  inquiryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  inquiryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    marginLeft: 16,
  },
  inquiryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inquiryDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default InquiryScreen;
