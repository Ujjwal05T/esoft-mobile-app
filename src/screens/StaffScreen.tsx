import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import StaffCard, {StaffMember} from '../components/dashboard/StaffCard';
import AddStaffOverlay, {StaffFormData} from '../components/overlays/AddStaffOverlay';
import EditStaffOverlay, {EditStaffFormData} from '../components/overlays/EditStaffOverlay';
import ViewStaffOverlay from '../components/overlays/ViewStaffOverlay';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  getStaff,
  createStaff,
  updateStaff,
  activateStaff,
  deactivateStaff,
  deleteStaff,
  WorkshopStaffResponse,
  CreateStaffData,
  UpdateStaffData,
} from '../services/api';

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

const SearchIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 21L16.65 16.65"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function StaffScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Overlay states
  const [showAddOverlay, setShowAddOverlay] = useState(false);
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  const [showViewOverlay, setShowViewOverlay] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<EditStaffFormData | null>(null);

  // API data states
  const [staffList, setStaffList] = useState<WorkshopStaffResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch staff data from API
  const fetchStaffData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getStaff();
      if (response.success && response.data) {
        setStaffList(response.data.staff);
      } else {
        setError(response.error || 'Failed to fetch staff data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Filter staff based on active tab and search query
  const filteredStaff = staffList.filter(staff => {
    const matchesTab = activeTab === 'active' ? staff.isActive : !staff.isActive;
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phoneNumber.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  // Convert API response to StaffMember format for StaffCard
  const mapToStaffMember = (staff: WorkshopStaffResponse): StaffMember => ({
    id: String(staff.id),
    name: staff.name,
    role: staff.role,
    phone: staff.phoneNumber,
    avatar: staff.photoUrl ?? '',
    address: staff.address,
    isActive: staff.isActive,
  });

  const handleToggleExpand = (staffId: string) => {
    setExpandedCardId(expandedCardId === staffId ? null : staffId);
  };

  const handleEditStaff = (staffId: string) => {
    const staff = staffList.find(s => String(s.id) === staffId);
    if (staff) {
      setSelectedStaff({
        id: String(staff.id),
        name: staff.name,
        contactNumber: staff.phoneNumber,
        address: staff.address || '',
        role: staff.role,
        photo: staff.photoUrl || null,
        isActive: staff.isActive,
        permissions: {
          vehicleApprovals: staff.permissions.vehicleApprovals,
          inquiryApprovals: staff.permissions.inquiryApprovals,
          generateEstimates: staff.permissions.generateEstimates,
          createJobCard: staff.permissions.createJobCard,
          disputeApprovals: staff.permissions.disputeApprovals,
          quoteApprovalsPayments: staff.permissions.quoteApprovalsPayments,
        },
      });
      setShowEditOverlay(true);
    }
  };

  const handleViewStaff = (staffId: string) => {
    const staff = staffList.find(s => String(s.id) === staffId);
    if (staff) {
      const mappedStaff = mapToStaffMember(staff);
      setShowViewOverlay(true);
    }
  };

  const handleAddStaff = () => {
    setShowAddOverlay(true);
  };

  const handleStaffSubmit = async (staffData: StaffFormData) => {
    console.log('New staff data:', staffData);

    const createData: CreateStaffData = {
      name: staffData.name,
      phoneNumber: staffData.contactNumber,
      role: staffData.role,
      address: staffData.address,
      jobCategories: staffData.jobCategories,
      canApproveVehicles: staffData.permissions.vehicleApprovals,
      canApproveInquiries: staffData.permissions.inquiryApprovals,
      canGenerateEstimates: staffData.permissions.generateEstimates,
      canCreateJobCard: staffData.permissions.createJobCard,
      canApproveDisputes: staffData.permissions.disputeApprovals,
      canApproveQuotesPayments: staffData.permissions.quoteApprovalsPayments,
    };

    const response = await createStaff(createData);

    if (response.success) {
      setShowAddOverlay(false);
      fetchStaffData();
    } else {
      console.error('Failed to create staff:', response.error);
    }
  };

  const handleStaffUpdate = async (updatedStaff: EditStaffFormData) => {
    console.log('Updated staff data:', updatedStaff);

    const updateData: UpdateStaffData = {
      name: updatedStaff.name,
      phoneNumber: updatedStaff.contactNumber,
      address: updatedStaff.address,
      role: updatedStaff.role,
      canApproveVehicles: updatedStaff.permissions.vehicleApprovals,
      canApproveInquiries: updatedStaff.permissions.inquiryApprovals,
      canGenerateEstimates: updatedStaff.permissions.generateEstimates,
      canCreateJobCard: updatedStaff.permissions.createJobCard,
      canApproveDisputes: updatedStaff.permissions.disputeApprovals,
      canApproveQuotesPayments: updatedStaff.permissions.quoteApprovalsPayments,
    };

    const response = await updateStaff(parseInt(updatedStaff.id), updateData);

    if (response.success) {
      setShowEditOverlay(false);
      fetchStaffData();
    } else {
      console.error('Failed to update staff:', response.error);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    console.log('Delete staff:', staffId);

    const response = await deleteStaff(parseInt(staffId));
    if (response.success) {
      setShowEditOverlay(false);
      fetchStaffData(); // Refresh the list
    } else {
      console.error('Failed to delete staff:', response.error);
    }
  };

  const handleToggleStaffActive = async (
    staffId: string,
    isActive: boolean,
  ) => {
    console.log('Toggle staff active:', staffId, isActive);

    const id = parseInt(staffId);
    const response = isActive
      ? await activateStaff(id)
      : await deactivateStaff(id);

    if (response.success) {
      fetchStaffData(); // Refresh the list
    } else {
      console.error('Failed to toggle staff status:', response.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {searchVisible ? (
          <View style={styles.searchRow}>
            <TouchableOpacity
              onPress={() => {
                setSearchVisible(false);
                setSearchQuery('');
              }}
              style={styles.iconBtn}>
              <BackIcon />
            </TouchableOpacity>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search staff..."
              placeholderTextColor="#999"
              autoFocus
              style={styles.searchInput}
            />
          </View>
        ) : (
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.iconBtn}>
                <BackIcon />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>My Staff</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSearchVisible(true)}
              style={styles.iconBtn}>
              <SearchIcon />
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <View style={styles.tabs}>
            <TouchableOpacity
              onPress={() => setActiveTab('active')}
              style={[
                styles.tab,
                activeTab === 'active' && styles.tabActive,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'active' && styles.tabTextActive,
                ]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('inactive')}
              style={[
                styles.tab,
                activeTab === 'inactive' && styles.tabActive,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'inactive' && styles.tabTextActive,
                ]}>
                Inactive
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Staff List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          // Loading state
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#e5383b" />
            <Text style={styles.loadingText}>Loading staff...</Text>
          </View>
        ) : error ? (
          // Error state
          <View style={styles.emptyState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchStaffData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredStaff.length > 0 ? (
          <View style={styles.staffList}>
            {filteredStaff.map(staff => {
              const mappedStaff = mapToStaffMember(staff);
              return (
                <StaffCard
                  key={mappedStaff.id}
                  staff={mappedStaff}
                  isExpanded={expandedCardId === mappedStaff.id}
                  onToggleExpand={() => handleToggleExpand(mappedStaff.id)}
                  onEdit={() => handleEditStaff(mappedStaff.id)}
                  onView={() => handleViewStaff(mappedStaff.id)}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                  stroke="#ccc"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                  stroke="#ccc"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} staff found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active'
                ? 'Add staff members to get started'
                : 'No inactive staff members'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleAddStaff}
        style={styles.fab}
        activeOpacity={0.9}>
        <PlusIcon />
      </TouchableOpacity>

      {/* Add Staff Overlay */}
      <AddStaffOverlay
        isOpen={showAddOverlay}
        onClose={() => setShowAddOverlay(false)}
        onSubmit={handleStaffSubmit}
      />

      {/* Edit Staff Overlay */}
      <EditStaffOverlay
        isOpen={showEditOverlay}
        onClose={() => setShowEditOverlay(false)}
        staffData={selectedStaff}
        onUpdate={handleStaffUpdate}
        onToggleActive={handleToggleStaffActive}
        onDelete={handleDeleteStaff}
      />

      {/* View Staff Overlay */}
      <ViewStaffOverlay
        isOpen={showViewOverlay}
        onClose={() => setShowViewOverlay(false)}
        staff={null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 24,
    fontWeight: '600',
    color: '#e5383b',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000',
  },
  tabsRow: {
    marginTop: 16,
  },
  tabs: {
    backgroundColor: '#e5e5e5',
    borderRadius: 8,
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#e5383b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4c4c4c',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  staffList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#e5383b',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#e5383b',
    textDecorationLine: 'underline',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
