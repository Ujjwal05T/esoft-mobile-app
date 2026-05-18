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
  Platform,
  ToastAndroid,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import VehicleCard from '../dashboard/VehicleCard';
import {generatePDF} from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import RNShare from 'react-native-share';

interface VehicleInfo {
  plateNumber: string;
  year: number;
  make: string;
  model: string;
  specs: string;
  chassisNumber?: string;
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
  workshopName?: string;
  workshopAddress?: string;
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
  workshopName,
  workshopAddress,
}: EstimationOverlayProps) {
  const vehicle = vehicleInfo || defaultVehicle;
  const shopName = workshopName || 'Your Workshop';

  type ViewType = 'estimate' | 'review' | 'pdf';
  const [currentView, setCurrentView] = useState<ViewType>('estimate');
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfMeta, setPdfMeta] = useState<{estNumber: string; invoiceDate: string; dueDate: string} | null>(null);

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
      setPdfPath(null);
      setPdfBase64(null);
      setPdfMeta(null);
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

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});

  const buildPdfHtml = (meta: {estNumber: string; invoiceDate: string; dueDate: string}) => {
    const vehicleName = [vehicle.make, vehicle.model].filter(Boolean).join(' ') || '—';
    const rows = [
      ...parts.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${p.name}</b><br/><span class="sub">Part</span></td>
          <td class="ar">${p.quantity}</td>
          <td class="ar">&#8377;${p.rate.toLocaleString('en-IN')}</td>
          <td class="ar">&#8377;${(p.rate * p.quantity).toLocaleString('en-IN')}</td>
        </tr>`),
      ...labour.map((l, i) => `
        <tr>
          <td>${parts.length + i + 1}</td>
          <td><b>${l.name}</b><br/><span class="sub">Labour</span></td>
          <td class="ar">1</td>
          <td class="ar">&#8377;${l.rate.toLocaleString('en-IN')}</td>
          <td class="ar">&#8377;${l.rate.toLocaleString('en-IN')}</td>
        </tr>`),
      ...extras.map((e, i) => `
        <tr>
          <td>${parts.length + labour.length + i + 1}</td>
          <td><b>${e.description}</b><br/><span class="sub">Extra</span></td>
          <td class="ar">1</td>
          <td class="ar">&#8377;${e.rate.toLocaleString('en-IN')}</td>
          <td class="ar">&#8377;${e.rate.toLocaleString('en-IN')}</td>
        </tr>`),
    ].join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; padding: 36px; color: #1a1a1a; font-size: 12px; }

  .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #1a1a1a; }
  .shop-name { font-size: 15px; font-weight: bold; margin-bottom: 6px; }
  .shop-addr { font-size: 11px; color: #444; line-height: 1.75; white-space: pre-line; }
  .doc-title { font-size: 34px; font-weight: bold; color: #1a237e; letter-spacing: 0.5px; }

  .info-table { width: 100%; border-collapse: collapse; border: 1px solid #bbb; }
  .info-table td { padding: 7px 12px; font-size: 11px; border-bottom: 1px solid #ddd; }
  .info-table tr:last-child td { border-bottom: none; }
  .lbl { color: #555; width: 90px; }
  .val { font-weight: bold; }
  .mid { border-left: 1px solid #bbb; color: #555; width: 80px; }

  .bill-table { width: 100%; border-collapse: collapse; border: 1px solid #bbb; border-top: none; }
  .bill-table td { padding: 0; vertical-align: top; width: 50%; }
  .bill-right { border-left: 1px solid #bbb; }
  .bill-head { font-size: 10px; color: #555; padding: 5px 12px 4px; border-bottom: 1px solid #ddd; background: #f9f9f9; }
  .bill-body { padding: 7px 12px 12px; }
  .bill-name { font-size: 13px; font-weight: bold; margin-bottom: 4px; }
  .bill-sub { font-size: 11px; color: #444; }

  .items { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .items thead tr { background: #1a237e; }
  .items th { padding: 8px 10px; color: #fff; text-align: left; font-size: 11px; border: 1px solid #1a237e; }
  .items th.ar { text-align: right; }
  .items td { padding: 7px 10px; font-size: 11px; border: 1px solid #ddd; vertical-align: top; }
  .sub { font-size: 9px; color: #888; }
  .ar { text-align: right; }

  .totals-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
  .totals { width: 260px; border-collapse: collapse; border: 1px solid #bbb; }
  .totals td { padding: 6px 12px; font-size: 11px; border-bottom: 1px solid #ddd; }
  .totals tr:last-child td { border-bottom: none; font-weight: bold; font-size: 12px; background: #e8eaf6; color: #1a237e; }
  .totals .ar { text-align: right; }

  .footer { margin-top: 20px; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
</style>
</head><body>

<div class="header">
  <div>
    <div class="shop-name">${shopName}</div>
    <div class="shop-addr">${(workshopAddress || '').replace(/,\s*/g, '\n')}</div>
  </div>
  <div class="doc-title">JOB ESTIMATE</div>
</div>

<table class="info-table">
  <tr>
    <td class="lbl">Invoice#</td><td class="val">${meta.estNumber}</td>
    <td class="mid">Vehicle</td><td>: <b>${vehicleName}</b></td>
  </tr>
  <tr>
    <td class="lbl">Invoice Date</td><td class="val">${meta.invoiceDate}</td>
    <td class="mid">Year</td><td>: <b>${vehicle.year || '—'}</b></td>
  </tr>
  <tr>
    <td class="lbl">Terms</td><td class="val">Estimate valid for 15 days</td>
    <td class="mid">Variant</td><td>: <b>${vehicle.specs || '—'}</b></td>
  </tr>
  <tr>
    <td class="lbl">Due Date</td><td class="val">${meta.dueDate}</td>
    <td class="mid">Chassis No</td><td>: <b>${vehicle.chassisNumber || 'Not Provided'}</b></td>
  </tr>
</table>

<table class="bill-table">
  <tr>
    <td>
      <div class="bill-head">Bill To</div>
      <div class="bill-body">
        <div class="bill-name">${customerName || '—'}</div>
        ${gstNumber ? `<div class="bill-sub">Gst No. : ${gstNumber}</div>` : ''}
      </div>
    </td>
    <td class="bill-right">
      <div class="bill-head">Ship To</div>
      <div class="bill-body"><div class="bill-sub">Same as Bill To</div></div>
    </td>
  </tr>
</table>

<table class="items">
  <thead>
    <tr>
      <th style="width:28px">#</th>
      <th>Item &amp; Description</th>
      <th class="ar" style="width:40px">Qty</th>
      <th class="ar" style="width:80px">Rate</th>
      <th class="ar" style="width:90px">Amount</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="totals-wrap">
  <table class="totals">
    <tr><td>Sub Total</td><td class="ar">&#8377;${subTotal.toLocaleString('en-IN')}</td></tr>
    ${discountValue > 0 ? `<tr><td>Discount</td><td class="ar">&#8377;${discountValue.toLocaleString('en-IN')}</td></tr>` : ''}
    <tr><td>Total Payable</td><td class="ar">&#8377;${totalPayable.toLocaleString('en-IN')}</td></tr>
    <tr><td>Balance Due</td><td class="ar">&#8377;${totalPayable.toLocaleString('en-IN')}</td></tr>
  </table>
</div>

<p class="footer">This is an estimate, not an invoice. Prices are subject to change upon final inspection. Approval required before work begins.</p>

</body></html>`;
  };

  const handleGeneratePDF = async () => {
    onGeneratePDF?.({
      parts, labour, extras, partsTotal, labourTotal, extrasTotal,
      subTotal, discount: discountValue, totalPayable,
      customerName, gstNumber,
    });
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 15);
    const meta = {
      estNumber: `EST-${String(now.getTime()).slice(-6).padStart(6, '0')}`,
      invoiceDate: fmtDate(now),
      dueDate: fmtDate(due),
    };
    setPdfMeta(meta);
    setGeneratingPDF(true);
    try {
      const result = await generatePDF({
        html: buildPdfHtml(meta),
        fileName: `estimate_${vehicle.plateNumber.replace(/\s+/g, '_')}_${Date.now()}`,
        directory: 'Documents',
        width: 595,
        height: 842,
        padding: 0,
        base64: true,
      });
      setPdfPath(result.filePath);
      setPdfBase64(result.base64 ?? null);
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
    setCurrentView('pdf');
  };

  const handleDownload = async () => {
    if (!pdfPath) {
      Alert.alert('Not ready', 'PDF is still generating.');
      return;
    }
    if (Platform.OS === 'android') {
      try {
        const dest = `${RNFS.DownloadDirectoryPath}/estimate_${vehicle.plateNumber.replace(/\s+/g, '_')}.pdf`;
        await RNFS.copyFile(pdfPath, dest);
        ToastAndroid.show('PDF saved to Downloads', ToastAndroid.SHORT);
      } catch {
        Alert.alert('Error', 'Could not save to Downloads.');
      }
    } else {
      await RNShare.open({url: pdfPath, type: 'application/pdf', failOnCancel: false});
    }
  };

  const handleShare = async () => {
    if (!pdfBase64) {
      Alert.alert('Not ready', 'PDF is still generating.');
      return;
    }
    const sharePath = `${RNFS.CachesDirectoryPath}/estimate_${vehicle.plateNumber.replace(/\s+/g, '_')}.pdf`;
    try {
      await RNFS.writeFile(sharePath, pdfBase64, 'base64');
      await RNShare.open({
        url: `file://${sharePath}`,
        type: 'application/pdf',
        title: 'Job Estimate',
        failOnCancel: false,
      });
    } catch {
      // user cancelled or error
    } finally {
      RNFS.unlink(sharePath).catch(() => {});
    }
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

              <View style={[styles.inputBox, !!customerName && {borderColor: '#e5383b'}]}>
                {!!customerName && (
                  <Text style={styles.floatLabel}>Customer/Company Name</Text>
                )}
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Customer/Company Name"
                  placeholderTextColor="#828282"
                  style={styles.inputBoxText}
                />
              </View>

              <View style={styles.gstWrapper}>
                {!!gstNumber && (
                  <Text style={styles.floatLabel}>GST NO.</Text>
                )}
                <View style={[styles.gstBox, !!gstNumber && {borderColor: '#e5383b'}]}>
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

              <TouchableOpacity
                onPress={handleGeneratePDF}
                style={styles.primaryBtn}
                disabled={generatingPDF}>
                {generatingPDF ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>GENERATE PDF</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ========== PDF VIEW ========== */}
          {currentView === 'pdf' && (
            <View style={styles.sectionGap}>
              <View style={styles.pdfPreviewOuter}>
                <View style={styles.pdfDoc}>

                  {/* Header */}
                  <View style={styles.pdfTopRow}>
                    <View style={{flex: 1}}>
                      <Text style={styles.pdfShopName}>{shopName}</Text>
                      {!!workshopAddress && (
                        <Text style={styles.pdfShopAddr}>{workshopAddress}</Text>
                      )}
                    </View>
                    <Text style={styles.pdfDocTitle}>JOB{'\n'}ESTIMATE</Text>
                  </View>

                  {/* Info grid */}
                  <View style={styles.pdfInfoGrid}>
                    {([
                      ['Invoice#', pdfMeta?.estNumber ?? '', 'Vehicle', [vehicle.make, vehicle.model].filter(Boolean).join(' ') || '—'],
                      ['Inv. Date', pdfMeta?.invoiceDate ?? '', 'Year', String(vehicle.year || '—')],
                      ['Terms', 'Valid 15 days', 'Variant', vehicle.specs || '—'],
                      ['Due Date', pdfMeta?.dueDate ?? '', 'Chassis', vehicle.chassisNumber || 'Not Provided'],
                    ] as [string, string, string, string][]).map(([l1, v1, l2, v2], i) => (
                      <View key={i} style={styles.pdfInfoRow}>
                        <Text style={styles.pdfInfoLbl}>{l1}</Text>
                        <Text style={styles.pdfInfoVal} numberOfLines={1}>{v1}</Text>
                        <View style={styles.pdfInfoMid} />
                        <Text style={styles.pdfInfoLbl}>{l2}</Text>
                        <Text style={[styles.pdfInfoVal, {flex: 1}]} numberOfLines={1}>: {v2}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Bill To / Ship To */}
                  <View style={styles.pdfBillRow}>
                    <View style={styles.pdfBillCell}>
                      <Text style={styles.pdfBillHead}>Bill To</Text>
                      <Text style={styles.pdfBillName} numberOfLines={1}>{customerName || '—'}</Text>
                      {!!gstNumber && <Text style={styles.pdfBillSub}>Gst No. : {gstNumber}</Text>}
                    </View>
                    <View style={[styles.pdfBillCell, styles.pdfBillRight]}>
                      <Text style={styles.pdfBillHead}>Ship To</Text>
                      <Text style={styles.pdfBillSub}>Same as Bill To</Text>
                    </View>
                  </View>

                  {/* Items header */}
                  <View style={styles.pdfItemsHdr}>
                    <Text style={[styles.pdfItemsHdrTxt, {width: 14}]}>#</Text>
                    <Text style={[styles.pdfItemsHdrTxt, {flex: 1}]}>Item &amp; Description</Text>
                    <Text style={[styles.pdfItemsHdrTxt, {width: 22, textAlign: 'right'}]}>Qty</Text>
                    <Text style={[styles.pdfItemsHdrTxt, {width: 38, textAlign: 'right'}]}>Rate</Text>
                    <Text style={[styles.pdfItemsHdrTxt, {width: 44, textAlign: 'right'}]}>Amount</Text>
                  </View>

                  {/* Items rows */}
                  {[
                    ...parts.map((p, i) => ({idx: i + 1, name: p.name, tag: 'Part', qty: p.quantity, rate: p.rate, amount: p.rate * p.quantity})),
                    ...labour.map((l, i) => ({idx: parts.length + i + 1, name: l.name, tag: 'Labour', qty: 1, rate: l.rate, amount: l.rate})),
                    ...extras.map((e, i) => ({idx: parts.length + labour.length + i + 1, name: e.description, tag: 'Extra', qty: 1, rate: e.rate, amount: e.rate})),
                  ].map(item => (
                    <View key={item.idx} style={styles.pdfItemRow}>
                      <Text style={[styles.pdfItemTxt, {width: 14}]}>{item.idx}</Text>
                      <View style={{flex: 1}}>
                        <Text style={[styles.pdfItemTxt, {fontWeight: '600'}]} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.pdfItemTag}>{item.tag}</Text>
                      </View>
                      <Text style={[styles.pdfItemTxt, {width: 22, textAlign: 'right'}]}>{item.qty}</Text>
                      <Text style={[styles.pdfItemTxt, {width: 38, textAlign: 'right'}]}>₹{item.rate.toLocaleString('en-IN')}</Text>
                      <Text style={[styles.pdfItemTxt, {width: 44, textAlign: 'right'}]}>₹{item.amount.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}

                  {/* Totals */}
                  <View style={styles.pdfTotalsWrap}>
                    <View style={styles.pdfTotalsBox}>
                      <View style={styles.pdfTotalRow}><Text style={styles.pdfTotalLbl}>Sub Total</Text><Text style={styles.pdfTotalVal}>₹{subTotal.toLocaleString('en-IN')}</Text></View>
                      {discountValue > 0 && (
                        <View style={styles.pdfTotalRow}><Text style={styles.pdfTotalLbl}>Discount</Text><Text style={styles.pdfTotalVal}>₹{discountValue.toLocaleString('en-IN')}</Text></View>
                      )}
                      <View style={styles.pdfTotalRow}><Text style={styles.pdfTotalLbl}>Total Payable</Text><Text style={styles.pdfTotalVal}>₹{totalPayable.toLocaleString('en-IN')}</Text></View>
                      <View style={styles.pdfBalanceRow}><Text style={styles.pdfBalanceTxt}>Balance Due</Text><Text style={styles.pdfBalanceTxt}>₹{totalPayable.toLocaleString('en-IN')}</Text></View>
                    </View>
                  </View>

                  {/* Footer */}
                  <Text style={styles.pdfFooter}>
                    This is an estimate, not an invoice. Prices are subject to change upon final inspection.
                  </Text>
                </View>
              </View>

              <View style={styles.pdfActions}>
                <TouchableOpacity style={styles.pdfBtn} onPress={handleDownload}>
                  <DownloadIcon />
                  <Text style={styles.pdfBtnText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pdfBtn} onPress={handleShare}>
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
    paddingVertical: 10,
    position: 'relative',
  },
  floatLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    fontSize: 11,
    color: '#828282',
    zIndex: 1,
  },
  inputBoxText: {fontSize: 15, color: '#000'},
  gstWrapper: {
    position: 'relative',
  },
  gstBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  pdfPreviewOuter: {backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12},
  pdfDoc: {
    backgroundColor: '#fff',
    borderRadius: 4,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 10,
    overflow: 'hidden',
  },

  // Header
  pdfTopRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#1a1a1a', paddingBottom: 8, marginBottom: 0},
  pdfShopName: {fontSize: 9, fontWeight: '700', color: '#1a1a1a', marginBottom: 2},
  pdfShopAddr: {fontSize: 7, color: '#555', lineHeight: 11},
  pdfDocTitle: {fontSize: 14, fontWeight: '700', color: '#1a237e', textAlign: 'right', lineHeight: 17},

  // Info grid
  pdfInfoGrid: {borderWidth: 1, borderColor: '#bbb', borderTopWidth: 0},
  pdfInfoRow: {flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#ddd'},
  pdfInfoLbl: {fontSize: 7, color: '#666', width: 52, paddingVertical: 4, paddingLeft: 5},
  pdfInfoVal: {fontSize: 7, fontWeight: '700', color: '#111', width: 70, paddingVertical: 4},
  pdfInfoMid: {width: 1, alignSelf: 'stretch', backgroundColor: '#bbb'},

  // Bill To / Ship To
  pdfBillRow: {flexDirection: 'row', borderWidth: 1, borderTopWidth: 0, borderColor: '#bbb'},
  pdfBillCell: {flex: 1, paddingBottom: 6},
  pdfBillRight: {borderLeftWidth: 1, borderLeftColor: '#bbb'},
  pdfBillHead: {fontSize: 7, color: '#666', padding: 4, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: '#ddd', backgroundColor: '#f9f9f9'},
  pdfBillName: {fontSize: 8, fontWeight: '700', color: '#111', paddingHorizontal: 5, paddingTop: 4},
  pdfBillSub: {fontSize: 7, color: '#555', paddingHorizontal: 5, paddingTop: 2},

  // Items table
  pdfItemsHdr: {flexDirection: 'row', backgroundColor: '#1a237e', paddingVertical: 5, paddingHorizontal: 4, marginTop: 8},
  pdfItemsHdrTxt: {fontSize: 7, color: '#fff', fontWeight: '600'},
  pdfItemRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#eee'},
  pdfItemTxt: {fontSize: 7, color: '#111'},
  pdfItemTag: {fontSize: 6, color: '#888', marginTop: 1},

  // Totals
  pdfTotalsWrap: {alignItems: 'flex-end', marginTop: 8},
  pdfTotalsBox: {width: 160, borderWidth: 1, borderColor: '#bbb'},
  pdfTotalRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#eee'},
  pdfTotalLbl: {fontSize: 7, color: '#444'},
  pdfTotalVal: {fontSize: 7, color: '#111'},
  pdfBalanceRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 6, backgroundColor: '#e8eaf6'},
  pdfBalanceTxt: {fontSize: 8, fontWeight: '700', color: '#1a237e'},

  // Footer
  pdfFooter: {fontSize: 6.5, color: '#888', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#ddd'},

  pdfActions: {flexDirection: 'row', gap: 16},
  pdfBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#e5383b', paddingVertical: 16, borderRadius: 8,
  },
  pdfBtnText: {color: '#fff', fontSize: 15, fontWeight: '500'},
});
