import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import StatusBadge, {normalizeStatus} from '../components/ui/StatusBadge';
import EditInquiryItemOverlay from '../components/overlays/EditInquiryItemOverlay';
import EditInquiryOverlay from '../components/overlays/EditInquiryOverlay';
import {
  getInquiryById,
  updateInquiryStatus,
  updateInquiryItem,
  createInquiry,
  type InquiryResponse,
  type InquiryItemResponse,
} from '../services/api';
import Svg, {Path} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';
import {useAuth} from '../context/AuthContext';

type InquiryDetailRouteProp = RouteProp<RootStackParamList, 'InquiryDetail'>;
type InquiryDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'InquiryDetail'
>;

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke="#1a1a1a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
      stroke="#1a1a1a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function InquiryDetailScreen() {
  const navigation = useNavigation<InquiryDetailNavigationProp>();
  const route = useRoute<InquiryDetailRouteProp>();
  const {inquiryId} = route.params;
  const {userRole, user} = useAuth();

  const [inquiry, setInquiry] = useState<InquiryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InquiryItemResponse | null>(null);
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  const [showEditInquiryOverlay, setShowEditInquiryOverlay] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  const fetchInquiry = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getInquiryById(inquiryId);
      if (result.success && result.data) {
        setInquiry(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch inquiry:', error);
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchInquiry()]);
    setRefreshing(false);
  }, [fetchInquiry]);

  useEffect(() => {
    if (inquiryId) {
      fetchInquiry();
    }
  }, [inquiryId, fetchInquiry]);

  // Status helpers
  const status = inquiry?.status?.toLowerCase() || '';
  const isOpen = status === 'open';
  const isRequested = status === 'requested';
  const isDeclined = status === 'declined';
  const isClosed = status === 'closed';

  // Date formatting
  const formatDate = (dateStr: string) => {
    return new Date(dateStr)
      .toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .toLowerCase();
  };

  // Get the date label based on status
  const getDateLabel = () => {
    if (isDeclined && inquiry?.declinedDate) {
      return `Declined: ${formatDate(inquiry.declinedDate)}`;
    }
    if (isClosed && inquiry?.closedDate) {
      return `Closed: ${formatDate(inquiry.closedDate)}`;
    }
    return `Placed: ${formatDate(inquiry?.placedDate || '')}`;
  };

  // Handle status updates
  const handleReRequest = async () => {
    if (!inquiry) return;

    setAppAlert({
      type: 'confirm',
      title: 'Re-request Inquiry',
      message: 'Are you sure you want to re-request this inquiry?',
      onConfirm: () => {
        (async () => {
          try {
            setActionLoading(true);
            const isStaff = userRole === 'staff';
            const result = await createInquiry({
              vehicleId: inquiry.vehicleId,
              vehicleVisitId: inquiry.vehicleVisitId ?? undefined,
              workshopOwnerId: inquiry.workshopOwnerId,
              requestedByStaffId: isStaff ? (user?.id ?? null) : null,
              jobCategories: inquiry.jobCategories,
              items: inquiry.items.map(item => ({
                partName: item.partName,
                preferredBrand: item.preferredBrand,
                quantity: item.quantity,
                remark: item.remark,
                audioUrl: item.audioUrl ?? undefined,
                audioDuration: item.audioDuration ?? undefined,
                image1Url: item.image1Url ?? undefined,
                image2Url: item.image2Url ?? undefined,
                image3Url: item.image3Url ?? undefined,
              })),
            });
            if (result.success) {
              setAppAlert({
                type: 'success',
                message: 'Inquiry re-requested successfully',
                onDone: () => navigation.goBack(),
              });
            } else {
              setAppAlert({type: 'error', message: result.error || 'Failed to re-request inquiry'});
            }
          } catch (error) {
            console.error('Failed to re-request inquiry:', error);
            setAppAlert({type: 'error', message: 'Failed to re-request inquiry'});
          } finally {
            setActionLoading(false);
          }
        })();
      },
    });
  };

  const handleCancelRequest = async () => {
    if (!inquiry) return;

    setAppAlert({
      type: 'confirm',
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this inquiry request?',
      onConfirm: () => {
        (async () => {
          try {
            setActionLoading(true);
            const result = await updateInquiryStatus(inquiry.id, 'Closed');
            if (result.success) {
              setAppAlert({type: 'success', message: 'Inquiry cancelled successfully'});
              // Refresh inquiry data
              const updatedInquiry = await getInquiryById(inquiryId);
              if (updatedInquiry.success && updatedInquiry.data) {
                setInquiry(updatedInquiry.data);
              }
            } else {
              setAppAlert({type: 'error', message: result.error || 'Failed to cancel inquiry'});
            }
          } catch (error) {
            console.error('Failed to cancel inquiry:', error);
            setAppAlert({type: 'error', message: 'Failed to cancel inquiry'});
          } finally {
            setActionLoading(false);
          }
        })();
      },
    });
  };

  const handleApproveAndSend = async () => {
    if (!inquiry) return;

    setAppAlert({
      type: 'confirm',
      title: 'Approve and Send',
      message: 'Are you sure you want to approve and send this inquiry?',
      onConfirm: () => {
        (async () => {
          try {
            setActionLoading(true);
            const result = await updateInquiryStatus(inquiry.id, 'open');
            if (result.success) {
              setAppAlert({type: 'success', message: 'Inquiry approved and sent successfully'});
              // Refresh inquiry data
              const updatedInquiry = await getInquiryById(inquiryId);
              if (updatedInquiry.success && updatedInquiry.data) {
                setInquiry(updatedInquiry.data);
              }
            } else {
              setAppAlert({type: 'error', message: result.error || 'Failed to approve inquiry'});
            }
          } catch (error) {
            console.error('Failed to approve inquiry:', error);
            setAppAlert({type: 'error', message: 'Failed to approve inquiry'});
          } finally {
            setActionLoading(false);
          }
        })();
      },
    });
  };

  const handleDecline = async () => {
    if (!inquiry) return;

    setAppAlert({
      type: 'confirm',
      title: 'Decline Inquiry',
      message: 'Are you sure you want to decline this inquiry?',
      onConfirm: () => {
        (async () => {
          try {
            setActionLoading(true);
            const result = await updateInquiryStatus(inquiry.id, 'Closed');
            if (result.success) {
              setAppAlert({type: 'success', message: 'Inquiry declined successfully'});
              // Refresh inquiry data
              const updatedInquiry = await getInquiryById(inquiryId);
              if (updatedInquiry.success && updatedInquiry.data) {
                setInquiry(updatedInquiry.data);
              }
            } else {
              setAppAlert({type: 'error', message: result.error || 'Failed to decline inquiry'});
            }
          } catch (error) {
            console.error('Failed to decline inquiry:', error);
            setAppAlert({type: 'error', message: 'Failed to decline inquiry'});
          } finally {
            setActionLoading(false);
          }
        })();
      },
    });
  };

  const handleItemClick = (itemId: number) => {
    if (status !== 'requested' && status !== 'open') return;
    const item = inquiry?.items.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setShowEditOverlay(true);
    }
  };

  const handleSaveItem = async (updatedItem: Partial<InquiryItemResponse>) => {
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const result = await updateInquiryItem(selectedItem.id, updatedItem);

      if (result.success) {
        setAppAlert({type: 'success', message: 'Inquiry item updated successfully!'});
        // Refresh inquiry data to show updated item
        const refreshResult = await getInquiryById(inquiryId);
        if (refreshResult.success && refreshResult.data) {
          setInquiry(refreshResult.data);
        }
      } else {
        setAppAlert({type: 'error', message: result.error || 'Failed to update inquiry item'});
      }
    } catch (error) {
      console.error('Error updating inquiry item:', error);
      setAppAlert({type: 'error', message: 'An error occurred while updating the inquiry item'});
    } finally {
      setActionLoading(false);
      setShowEditOverlay(false);
      setSelectedItem(null);
    }
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e5383b" />
          <Text style={styles.loadingText}>Loading inquiry details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Not found ───────────────────────────────────────────────
  if (!inquiry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundTitle}>Inquiry Not Found</Text>
          <Text style={styles.notFoundText}>
            The inquiry you're looking for doesn't exist.
          </Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconBtn}
            activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inquiry Details</Text>
        </View>
        <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
          <SearchIcon />
        </TouchableOpacity>
      </View>

      {/* ── Page Body ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#e5383b']}
            tintColor="#e5383b"
          />
        }>
        {/* ════════════════════════════════════════
            INQUIRY INFO CARD
            ════════════════════════════════════════ */}
        <View style={styles.infoCard}>
          {/* Top row: vehicle info + status badge */}
          <View style={styles.infoCardTop}>
            {/* Left: vehicle + inquiry info */}
            <View style={styles.infoCardLeft}>
              {inquiry.vehicleName && (
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{inquiry.vehicleName}</Text>
                  {inquiry.numberPlate && (
                    <Text style={styles.numberPlate}>{inquiry.numberPlate}</Text>
                  )}
                </View>
              )}
              <View style={styles.inquiryInfo}>
                <Text style={styles.inquiryNumber}>{inquiry.inquiryNumber}</Text>
                <Text style={styles.dateLabel}>{getDateLabel()}</Text>
              </View>
            </View>

            {/* Right: status badge */}
            <View style={styles.statusBadgeContainer}>
              <StatusBadge status={normalizeStatus(inquiry.status)} />
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Inquiry by + Job Category */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Inquiry by: </Text>
              <Text style={styles.metaValue}>
                {inquiry.requestedByName || 'Owner'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Job Categories: </Text>
              <Text style={styles.metaValue}>
                {(inquiry.jobCategories ?? []).join(', ') || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════════════
            INQUIRY ITEMS LIST
            ════════════════════════════════════════ */}
        <View style={styles.itemsList}>
          {inquiry.items.map(item => {
            // Determine brand badge style
            const isOEM =
              item.preferredBrand?.toUpperCase() === 'OEM - ORIGINAL BRANDS';
            const brandLabel = isOEM ? 'OEM' : 'AM';
            const brandBgColor = isOEM ? '#e4e4e4' : '#f3f3f3';
            const brandTextColor = isOEM ? '#000' : '#e5383b';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => handleItemClick(item.id)}
                activeOpacity={0.7}>
                <View style={styles.itemContent}>
                  {/* Part name with quantity */}
                  <View style={styles.itemRow}>
                    <Text style={styles.itemPartName}>
                      {item.partName}
                      {item.quantity > 1 ? ` x ${item.quantity}` : ''}
                    </Text>
                  </View>

                  {/* Remark + Brand badge */}
                  <View style={styles.itemBottomRow}>
                    <Text style={styles.itemRemark} numberOfLines={1}>
                      {item.remark || item.preferredBrand || '-'}
                    </Text>
                    <View
                      style={[
                        styles.brandBadge,
                        {backgroundColor: brandBgColor},
                      ]}>
                      <Text style={[styles.brandBadgeText, {color: brandTextColor}]}>
                        {brandLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════
          BOTTOM FIXED CTA BUTTONS
          ════════════════════════════════════════ */}
      {(isOpen || isRequested || isDeclined || isClosed) && (
        <View style={styles.bottomCTA}>
          {/* Fade gradient */}
          <View style={styles.fadeGradient} />

          <View style={styles.buttonContainer}>
            {/* ── Open status: EDIT + CANCEL REQUEST ── */}
            {isOpen && (
              <>
                <TouchableOpacity
                  style={[styles.primaryButton, actionLoading && styles.buttonDisabled]}
                  onPress={() => setShowEditInquiryOverlay(true)}
                  disabled={actionLoading}
                  activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, actionLoading && styles.buttonDisabled]}
                  onPress={handleCancelRequest}
                  disabled={actionLoading}
                  activeOpacity={0.8}>
                  <Text style={styles.secondaryButtonText}>CANCEL REQUEST</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Requested status: APPROVE AND SEND + DECLINE ── */}
            {isRequested && (
              <>
                <TouchableOpacity
                  style={[styles.primaryButton, actionLoading && styles.buttonDisabled]}
                  onPress={handleApproveAndSend}
                  disabled={actionLoading}
                  activeOpacity={0.8}>
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>APPROVE AND SEND</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, actionLoading && styles.buttonDisabled]}
                  onPress={handleDecline}
                  disabled={actionLoading}
                  activeOpacity={0.8}>
                  <Text style={styles.secondaryButtonText}>DECLINE</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Declined status: RE REQUEST (full-width) ── */}
            {isDeclined && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.fullWidthButton,
                  actionLoading && styles.buttonDisabled,
                ]}
                onPress={handleReRequest}
                disabled={actionLoading}
                activeOpacity={0.8}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>RE REQUEST</Text>
                )}
              </TouchableOpacity>
            )}

            {/* ── Closed status: RE REQUEST (full-width) ── */}
            {isClosed && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.fullWidthButton,
                  actionLoading && styles.buttonDisabled,
                ]}
                onPress={handleReRequest}
                disabled={actionLoading}
                activeOpacity={0.8}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>RE REQUEST</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Edit Inquiry Item Overlay */}
      {inquiry && (
        <EditInquiryOverlay
          isOpen={showEditInquiryOverlay}
          onClose={() => setShowEditInquiryOverlay(false)}
          inquiryId={inquiry.id}
          initialItems={inquiry.items}
          onSuccess={async () => {
            const updated = await getInquiryById(inquiryId);
            if (updated.success && updated.data) setInquiry(updated.data);
          }}
        />
      )}
      {selectedItem && (
        <EditInquiryItemOverlay
          isOpen={showEditOverlay}
          onClose={() => {
            setShowEditOverlay(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSave={handleSaveItem}
        />
      )}
      <AppAlert
        isOpen={!!appAlert}
        type={appAlert?.type ?? 'info'}
        title={appAlert?.title}
        message={appAlert?.message ?? ''}
        onClose={() => {
          const done = appAlert?.onDone;
          setAppAlert(null);
          done?.();
        }}
        onConfirm={appAlert?.onConfirm ? () => {
          const confirm = appAlert.onConfirm!;
          setAppAlert(null);
          confirm();
        } : undefined}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  goBackButton: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goBackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e5383b',
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },

  // Info card
  infoCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 10,
    padding: 16,
  },
  infoCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoCardLeft: {
    flex: 1,
    gap: 8,
  },
  vehicleInfo: {
    gap: 2,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4c4c4c',
  },
  numberPlate: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e5383b',
  },
  inquiryInfo: {
    gap: 2,
  },
  inquiryNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e8353b',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#828282',
  },
  statusBadgeContainer: {
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#dadada',
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#e5383b',
  },

  // Items list
  itemsList: {
    marginTop: 8,
    gap: 5,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 13,
  },
  itemContent: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPartName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#323232',
    flex: 1,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemRemark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#969696',
    flex: 1,
    marginRight: 10,
  },
  brandBadge: {
    borderRadius: 7,
    paddingHorizontal: 26,
    paddingVertical: 4,
    height: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.41,
  },

  // Bottom CTA
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingBottom: 16,
  },
  fadeGradient: {
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  buttonContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  primaryButton: {
    flex: 1,
    maxWidth: 197,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    borderWidth: 1,
    borderColor: '#e5383b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    maxWidth: 197,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidthButton: {
    flex: 1,
    maxWidth: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: -0.01,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5383b',
    textTransform: 'uppercase',
    letterSpacing: -0.01,
  },
});
