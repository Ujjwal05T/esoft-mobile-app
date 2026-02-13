import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import VehicleCard from '../dashboard/VehicleCard';

interface VehicleInfo {
  plateNumber: string;
  year: number;
  make: string;
  model: string;
  specs: string;
}

interface Part {
  id: string;
  name: string;
  quantity: number;
  rate: number;
}

interface Labour {
  id: string;
  name: string;
  rate: number;
}

interface Extra {
  id: string;
  description: string;
  rate: number;
}

export interface EstimationData {
  parts: Part[];
  labour: Labour[];
  extras: Extra[];
  partsTotal: number;
  labourTotal: number;
  extrasTotal: number;
  subTotal: number;
  discount: number;
  totalPayable: number;
}

interface EstimationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewEstimate?: (data: EstimationData) => void;
  onGeneratePDF?: (data: EstimationData & {customerName: string; gstNumber: string}) => void;
  vehicleInfo?: VehicleInfo;
}

const defaultVehicle: VehicleInfo = {
  plateNumber: 'MP O9 CY 1321',
  year: 2018,
  make: 'Toyota',
  model: 'Crysta',
  specs: '2.4L ZX MT/Diesel',
};

const defaultParts: Part[] = [
  {id: '1', name: 'Bosch Oil Filter', quantity: 1, rate: 350},
  {id: '2', name: 'TVS Lucas Oil Strainer', quantity: 2, rate: 700},
  {id: '3', name: 'Rane Brake Disk', quantity: 2, rate: 6000},
  {id: '4', name: 'Air Filter', quantity: 1, rate: 3500},
];
const defaultLabour: Labour[] = [
  {id: '1', name: 'Brake Disk Replacement', rate: 1000},
  {id: '2', name: 'Oil Change', rate: 500},
  {id: '3', name: 'General Inspection', rate: 2000},
];
const defaultExtras: Extra[] = [{id: '1', description: 'Inspection', rate: 1000}];

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
const formatCurrencyShort = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-IN')}`;

// Icons
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
const TrashIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M2.5 5H4.167H17.5M6.667 5V3.333C6.667 2.891 6.842 2.467 7.155 2.155C7.467 1.842 7.891 1.667 8.333 1.667H11.667C12.109 1.667 12.533 1.842 12.845 2.155C13.158 2.467 13.333 2.891 13.333 3.333V5M15.833 5V16.667C15.833 17.109 15.658 17.533 15.345 17.845C15.033 18.158 14.609 18.333 14.167 18.333H5.833C5.391 18.333 4.967 18.158 4.655 17.845C4.342 17.533 4.167 17.109 4.167 16.667V5H15.833Z"
      stroke="#E5383B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
const PlusIcon = ({color = 'white'}: {color?: string}) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M8 3.333V12.667M3.333 8H12.667"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
const MinusIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M3.333 8H12.667"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
const ChevronIcon = ({isOpen}: {isOpen: boolean}) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d={isOpen ? 'M17 14L12 9L7 14' : 'M7 10L12 15L17 10'}
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
const DownloadIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 10L12 15L17 10M12 15V3"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
const ShareIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12M16 6L12 2L8 6M12 2V15"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function EstimationOverlay({
  isOpen,
  onClose,
  onReviewEstimate,
  onGeneratePDF,
  vehicleInfo,
}: EstimationOverlayProps) {
  const vehicle = vehicleInfo || defaultVehicle;

  type ViewType = 'estimate' | 'review' | 'pdf';
  const [currentView, setCurrentView] = useState<ViewType>('estimate');

  const [isPartsOpen, setIsPartsOpen] = useState(false);
  const [isLabourOpen, setIsLabourOpen] = useState(false);
  const [isExtrasOpen, setIsExtrasOpen] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [isGstVerified, setIsGstVerified] = useState(false);

  const [parts, setParts] = useState<Part[]>(defaultParts);
  const [labour, setLabour] = useState<Labour[]>(defaultLabour);
  const [extras, setExtras] = useState<Extra[]>(defaultExtras);

  const [newLabourName, setNewLabourName] = useState('');
  const [newLabourRate, setNewLabourRate] = useState('');
  const [newExtraDescription, setNewExtraDescription] = useState('');
  const [newExtraRate, setNewExtraRate] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');

  const partsTotal = parts.reduce((sum, p) => sum + p.quantity * p.rate, 0);
  const labourTotal = labour.reduce((sum, l) => sum + l.rate, 0);
  const extrasTotal = extras.reduce((sum, e) => sum + e.rate, 0);
  const subTotal = partsTotal + labourTotal + extrasTotal;

  const discountValue = (() => {
    if (discountPercent && parseFloat(discountPercent) > 0)
      return (subTotal * parseFloat(discountPercent)) / 100;
    if (discountAmount && parseFloat(discountAmount) > 0)
      return parseFloat(discountAmount);
    return 0;
  })();
  const totalPayable = subTotal - discountValue;
  const allFilled = parts.length > 0 && labour.length > 0 && extras.length > 0;

  useEffect(() => {
    if (!isOpen) {
      setCurrentView('estimate');
      setIsPartsOpen(false);
      setIsLabourOpen(false);
      setIsExtrasOpen(false);
      setParts(defaultParts);
      setLabour(defaultLabour);
      setExtras(defaultExtras);
      setNewLabourName('');
      setNewLabourRate('');
      setNewExtraDescription('');
      setNewExtraRate('');
      setDiscountPercent('');
      setDiscountAmount('');
      setCustomerName('');
      setGstNumber('');
      setIsGstVerified(false);
    }
  }, [isOpen]);

  const handleReviewEstimate = () => {
    const data: EstimationData = {
      parts, labour, extras, partsTotal, labourTotal, extrasTotal,
      subTotal, discount: discountValue, totalPayable,
    };
    onReviewEstimate?.(data);
    setCurrentView('review');
  };

  const handleGeneratePDF = () => {
    onGeneratePDF?.({
      parts, labour, extras, partsTotal, labourTotal, extrasTotal,
      subTotal, discount: discountValue, totalPayable,
      customerName, gstNumber,
    });
    setCurrentView('pdf');
  };

  const handleBack = () => {
    if (currentView === 'pdf') setCurrentView('review');
    else if (currentView === 'review') setCurrentView('estimate');
    else onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={{padding: 4}}>
              <BackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Estimate</Text>
          </View>

          {/* ========== ESTIMATE VIEW ========== */}
          {currentView === 'estimate' && (
            <View style={styles.sectionGap}>
              {/* PARTS SECTION */}
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={() => setIsPartsOpen(o => !o)}
                  style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Parts{partsTotal > 0 ? ` - ${formatCurrency(partsTotal)}` : ''}
                  </Text>
                  <ChevronIcon isOpen={isPartsOpen} />
                </TouchableOpacity>

                {isPartsOpen && (
                  <View style={styles.sectionBody}>
                    <View style={styles.colHeaders}>
                      <Text style={styles.colHeaderText}>Part Name</Text>
                      <View style={styles.colHeaderRight}>
                        <Text style={[styles.colHeaderText, {width: 80, textAlign: 'center'}]}>QTY</Text>
                        <Text style={[styles.colHeaderText, {width: 70, textAlign: 'right'}]}>Rate (Rs)</Text>
                      </View>
                    </View>

                    {parts.map(part => (
                      <View key={part.id} style={styles.partRow}>
                        <View style={styles.partNameCell}>
                          {parts.length > 1 && (
                            <TouchableOpacity
                              onPress={() => setParts(ps => ps.filter(p => p.id !== part.id))}>
                              <TrashIcon />
                            </TouchableOpacity>
                          )}
                          <TextInput
                            value={part.name}
                            onChangeText={v =>
                              setParts(ps => ps.map(p => p.id === part.id ? {...p, name: v} : p))
                            }
                            style={styles.partNameInput}
                            placeholderTextColor="#9e9e9e"
                          />
                        </View>
                        <View style={styles.qtyControls}>
                          <TouchableOpacity
                            onPress={() =>
                              setParts(ps =>
                                ps.map(p =>
                                  p.id === part.id ? {...p, quantity: Math.max(1, p.quantity - 1)} : p,
                                ),
                              )
                            }
                            style={styles.qtyBtn}>
                            <MinusIcon />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{part.quantity}</Text>
                          <TouchableOpacity
                            onPress={() =>
                              setParts(ps =>
                                ps.map(p =>
                                  p.id === part.id ? {...p, quantity: p.quantity + 1} : p,
                                ),
                              )
                            }
                            style={styles.qtyBtn}>
                            <PlusIcon />
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          value={part.rate ? String(part.rate) : ''}
                          onChangeText={v =>
                            setParts(ps =>
                              ps.map(p =>
                                p.id === part.id ? {...p, rate: parseFloat(v) || 0} : p,
                              ),
                            )
                          }
                          placeholder="0"
                          placeholderTextColor="#9e9e9e"
                          keyboardType="numeric"
                          style={styles.rateInput}
                        />
                      </View>
                    ))}

                    <TouchableOpacity
                      onPress={() =>
                        setParts(ps => [
                          ...ps,
                          {id: Date.now().toString(), name: '', quantity: 1, rate: 0},
                        ])
                      }
                      style={styles.addBtn}>
                      <PlusIcon />
                      <Text style={styles.addBtnText}>Add parts</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* LABOUR SECTION */}
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={() => setIsLabourOpen(o => !o)}
                  style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Labour{labourTotal > 0 ? ` - ${formatCurrency(labourTotal)}` : ''}
                  </Text>
                  <ChevronIcon isOpen={isLabourOpen} />
                </TouchableOpacity>

                {isLabourOpen && (
                  <View style={styles.sectionBody}>
                    <View style={styles.colHeaders}>
                      <Text style={styles.colHeaderText}>Labour Type</Text>
                      <Text style={[styles.colHeaderText, {width: 70, textAlign: 'right'}]}>Rate (Rs)</Text>
                    </View>

                    {labour.map(l => (
                      <View key={l.id} style={styles.labourRow}>
                        <TouchableOpacity
                          onPress={() => setLabour(ls => ls.filter(x => x.id !== l.id))}>
                          <TrashIcon />
                        </TouchableOpacity>
                        <TextInput
                          value={l.name}
                          onChangeText={v =>
                            setLabour(ls => ls.map(x => x.id === l.id ? {...x, name: v} : x))
                          }
                          style={styles.labourNameInput}
                          placeholderTextColor="#9e9e9e"
                        />
                        <TextInput
                          value={l.rate ? String(l.rate) : ''}
                          onChangeText={v =>
                            setLabour(ls =>
                              ls.map(x => x.id === l.id ? {...x, rate: parseFloat(v) || 0} : x),
                            )
                          }
                          placeholder="Rs."
                          placeholderTextColor="#9e9e9e"
                          keyboardType="numeric"
                          style={styles.rateInput}
                        />
                      </View>
                    ))}

                    <View style={styles.newRow}>
                      <TextInput
                        value={newLabourName}
                        onChangeText={setNewLabourName}
                        placeholder="Labour Name"
                        placeholderTextColor="#9e9e9e"
                        style={styles.newRowInput}
                      />
                      <TextInput
                        value={newLabourRate}
                        onChangeText={setNewLabourRate}
                        placeholder="Rs."
                        placeholderTextColor="#9e9e9e"
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        if (newLabourName.trim() && newLabourRate) {
                          setLabour(ls => [
                            ...ls,
                            {id: Date.now().toString(), name: newLabourName.trim(), rate: parseFloat(newLabourRate) || 0},
                          ]);
                          setNewLabourName('');
                          setNewLabourRate('');
                        }
                      }}
                      style={styles.addBtn}>
                      <PlusIcon />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* EXTRAS SECTION */}
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={() => setIsExtrasOpen(o => !o)}
                  style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Extras{extrasTotal > 0 ? ` - ${formatCurrency(extrasTotal)}` : ''}
                  </Text>
                  <ChevronIcon isOpen={isExtrasOpen} />
                </TouchableOpacity>

                {isExtrasOpen && (
                  <View style={styles.sectionBody}>
                    <View style={styles.colHeaders}>
                      <Text style={styles.colHeaderText}>Description</Text>
                      <Text style={[styles.colHeaderText, {width: 70, textAlign: 'right'}]}>Rate (Rs)</Text>
                    </View>

                    {extras.map(e => (
                      <View key={e.id} style={styles.labourRow}>
                        <TouchableOpacity
                          onPress={() => setExtras(es => es.filter(x => x.id !== e.id))}>
                          <TrashIcon />
                        </TouchableOpacity>
                        <TextInput
                          value={e.description}
                          onChangeText={v =>
                            setExtras(es => es.map(x => x.id === e.id ? {...x, description: v} : x))
                          }
                          style={styles.labourNameInput}
                          placeholderTextColor="#9e9e9e"
                        />
                        <TextInput
                          value={e.rate ? String(e.rate) : ''}
                          onChangeText={v =>
                            setExtras(es =>
                              es.map(x => x.id === e.id ? {...x, rate: parseFloat(v) || 0} : x),
                            )
                          }
                          placeholder="Rs."
                          placeholderTextColor="#9e9e9e"
                          keyboardType="numeric"
                          style={styles.rateInput}
                        />
                      </View>
                    ))}

                    <View style={styles.newRow}>
                      <TextInput
                        value={newExtraDescription}
                        onChangeText={setNewExtraDescription}
                        placeholder="Description"
                        placeholderTextColor="#9e9e9e"
                        style={styles.newRowInput}
                      />
                      <TextInput
                        value={newExtraRate}
                        onChangeText={setNewExtraRate}
                        placeholder="Rs."
                        placeholderTextColor="#9e9e9e"
                        keyboardType="numeric"
                        style={styles.rateInput}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        if (newExtraDescription.trim() && newExtraRate) {
                          setExtras(es => [
                            ...es,
                            {id: Date.now().toString(), description: newExtraDescription.trim(), rate: parseFloat(newExtraRate) || 0},
                          ]);
                          setNewExtraDescription('');
                          setNewExtraRate('');
                        }
                      }}
                      style={styles.addBtn}>
                      <PlusIcon />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* TOTALS */}
              {allFilled && (
                <View style={styles.totals}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Sub Total</Text>
                    <Text style={styles.totalValue}>{formatCurrencyShort(subTotal)}</Text>
                  </View>

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Discounts</Text>
                    <View style={styles.discountRow}>
                      <TextInput
                        value={discountPercent}
                        onChangeText={v => {
                          setDiscountPercent(v);
                          if (v) setDiscountAmount('');
                        }}
                        placeholder="20 %"
                        placeholderTextColor="#9e9e9e"
                        keyboardType="numeric"
                        style={styles.discountInput}
                      />
                      <Text style={styles.orText}>OR</Text>
                      <TextInput
                        value={discountAmount}
                        onChangeText={v => {
                          setDiscountAmount(v);
                          if (v) setDiscountPercent('');
                        }}
                        placeholder="Rs."
                        placeholderTextColor="#9e9e9e"
                        keyboardType="numeric"
                        style={[styles.discountInput, {width: 90}]}
                      />
                    </View>
                  </View>

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.grandTotal}>{formatCurrencyShort(totalPayable)}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity onPress={handleReviewEstimate} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>REVIEW ESTIMATE</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========== REVIEW VIEW ========== */}
          {currentView === 'review' && (
            <View style={styles.sectionGap}>
              <VehicleCard
                plateNumber={vehicle.plateNumber}
                year={vehicle.year}
                make={vehicle.make}
                model={vehicle.model}
                specs={vehicle.specs}
                variant="default"
              />

              <View style={styles.inputBox}>
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Customer/Company Name"
                  placeholderTextColor="#828282"
                  style={styles.inputBoxText}
                />
              </View>

              <View style={styles.gstBox}>
                <TextInput
                  value={gstNumber}
                  onChangeText={v => {
                    setGstNumber(v);
                    setIsGstVerified(false);
                  }}
                  placeholder="GST NO."
                  placeholderTextColor="#828282"
                  style={[styles.inputBoxText, {flex: 1}]}
                />
                {isGstVerified ? (
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => gstNumber.trim() && setIsGstVerified(true)}
                    style={styles.verifyBtn}>
                    <Text style={styles.verifyBtnText}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.breakdownSection}>
                {[
                  {label: 'PART', value: partsTotal},
                  {label: 'LABOUR', value: labourTotal},
                  {label: 'EXTRAS', value: extrasTotal},
                  {label: 'DISCOUNT', value: discountValue},
                ].map(row => (
                  <View key={row.label} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{row.label}</Text>
                    <Text style={styles.breakdownValue}>Rs.{row.value.toLocaleString('en-IN')}</Text>
                  </View>
                ))}
                <View style={[styles.breakdownRow, {paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0'}]}>
                  <Text style={[styles.breakdownLabel, {fontWeight: '700', color: '#000'}]}>GRAND TOTAL</Text>
                  <Text style={styles.grandTotal}>Rs. {totalPayable.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleGeneratePDF} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>GENERATE PDF</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========== PDF VIEW ========== */}
          {currentView === 'pdf' && (
            <View style={styles.sectionGap}>
              {/* PDF Preview Card */}
              <View style={styles.pdfPreviewOuter}>
                <View style={styles.pdfDoc}>
                  <View style={styles.pdfHeader}>
                    <View>
                      <Text style={styles.pdfShopName}>National Car Service</Text>
                      <Text style={styles.pdfShopAddr}>Chopda Bazar, Dewas</Text>
                    </View>
                    <View style={styles.pdfLogo} />
                  </View>
                  <Text style={styles.pdfTitle}>JOB ESTIMATE</Text>

                  <View style={styles.pdfCustomer}>
                    <Text style={styles.pdfSmall}>Bill To:</Text>
                    <Text style={styles.pdfCustomerName}>{customerName || 'Customer Name'}</Text>
                    <Text style={styles.pdfSmall}>GST: {gstNumber || 'N/A'}</Text>
                  </View>

                  <View style={styles.pdfTableHeader}>
                    <Text style={[styles.pdfTableText, {width: 20}]}>#</Text>
                    <Text style={[styles.pdfTableText, {flex: 1}]}>Description</Text>
                    <Text style={[styles.pdfTableText, {width: 60, textAlign: 'right'}]}>Rate</Text>
                  </View>
                  {parts.slice(0, 4).map((part, idx) => (
                    <View key={part.id} style={styles.pdfTableRow}>
                      <Text style={[styles.pdfTableText, {width: 20}]}>{idx + 1}</Text>
                      <Text style={[styles.pdfTableText, {flex: 1}]} numberOfLines={1}>{part.name}</Text>
                      <Text style={[styles.pdfTableText, {width: 60, textAlign: 'right'}]}>
                        ₹{(part.rate * part.quantity).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.pdfTotals}>
                    <View style={styles.pdfTotalRow}>
                      <Text style={styles.pdfSmall}>Sub Total</Text>
                      <Text style={styles.pdfSmall}>₹{subTotal.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.pdfTotalRow}>
                      <Text style={styles.pdfSmall}>Discount</Text>
                      <Text style={styles.pdfSmall}>₹{discountValue.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.pdfTotalRow}>
                      <Text style={[styles.pdfSmall, {fontWeight: '700', color: '#e5383b'}]}>Total</Text>
                      <Text style={[styles.pdfSmall, {fontWeight: '700', color: '#e5383b'}]}>
                        ₹{totalPayable.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.pdfActions}>
                <TouchableOpacity style={styles.pdfBtn}>
                  <DownloadIcon />
                  <Text style={styles.pdfBtnText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pdfBtn}>
                  <ShareIcon />
                  <Text style={styles.pdfBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  handle: {
    width: 172, height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  headerTitle: {fontSize: 24, fontWeight: '600', color: '#000'},
  sectionGap: {gap: 12, paddingBottom: 16},
  section: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f0f0f0',
  },
  sectionTitle: {fontSize: 16, fontWeight: '500', color: '#000'},
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  colHeaderRight: {flexDirection: 'row', gap: 16},
  colHeaderText: {fontSize: 13, color: '#757575'},
  partRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  partNameCell: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0},
  partNameInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  qtyControls: {flexDirection: 'row', alignItems: 'center', gap: 4},
  qtyBtn: {
    width: 32, height: 32,
    backgroundColor: '#e5383b',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {width: 28, textAlign: 'center', fontSize: 14, fontWeight: '500', color: '#000'},
  rateInput: {
    width: 70,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  labourRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  labourNameInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  newRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  newRowInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#fff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e5383b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addBtnText: {color: '#fff', fontSize: 14, fontWeight: '500'},
  totals: {gap: 12, marginTop: 4},
  totalRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  totalLabel: {fontSize: 14, color: '#757575'},
  totalValue: {fontSize: 18, fontWeight: '500', color: '#000'},
  grandTotal: {fontSize: 20, fontWeight: '700', color: '#e5383b'},
  discountRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  discountInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
  },
  orText: {fontSize: 14, color: '#757575'},
  primaryBtn: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnText: {color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 1},
  inputBox: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputBoxText: {fontSize: 15, color: '#000'},
  gstBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  verifiedText: {fontSize: 14, fontWeight: '700', color: '#e5383b'},
  verifyBtn: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyBtnText: {color: '#fff', fontSize: 14, fontWeight: '500'},
  breakdownSection: {gap: 8},
  breakdownRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  breakdownLabel: {fontSize: 14, color: '#757575'},
  breakdownValue: {fontSize: 14, color: '#000'},
  pdfPreviewOuter: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  pdfDoc: {
    backgroundColor: '#fff',
    borderRadius: 4,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 12,
  },
  pdfHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8},
  pdfShopName: {fontSize: 10, fontWeight: '600', color: '#e5383b'},
  pdfShopAddr: {fontSize: 8, color: '#757575'},
  pdfLogo: {width: 30, height: 20, backgroundColor: '#0077b6', borderRadius: 2},
  pdfTitle: {fontSize: 12, fontWeight: '700', color: '#0077b6', textAlign: 'center', marginBottom: 8},
  pdfCustomer: {borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 8, marginBottom: 8},
  pdfSmall: {fontSize: 9, color: '#757575'},
  pdfCustomerName: {fontSize: 10, fontWeight: '500', color: '#000'},
  pdfTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 4,
    marginBottom: 4,
  },
  pdfTableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pdfTableText: {fontSize: 9, color: '#000'},
  pdfTotals: {marginTop: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 8, gap: 4},
  pdfTotalRow: {flexDirection: 'row', justifyContent: 'space-between'},
  pdfActions: {flexDirection: 'row', gap: 16},
  pdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e5383b',
    paddingVertical: 16,
    borderRadius: 8,
  },
  pdfBtnText: {color: '#fff', fontSize: 15, fontWeight: '500'},
});
