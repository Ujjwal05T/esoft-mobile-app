import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FiltersOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: FilterData) => void;
}

export interface FilterData {
  startDate: string;
  endDate: string;
  brand: string;
  model: string;
  year: string;
  vehicleNumber: string;
  assignedTo: string;
  addedBy: string;
  sortBy: 'amount_low_high' | 'amount_high_low' | 'relevance' | null;
}

type ActiveTab = 'date' | 'vehicle' | 'sort';

// ── Constants ─────────────────────────────────────────────────────────────────

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const brandList = [
  'MAHINDRA', 'TATA', 'SKODA', 'KIA', 'SUZUKI', 'HYUNDAI',
  'TOYOTA', 'MG', 'NISSAN', 'RENAULT', 'HONDA', 'FORD',
];
const modelList = ['Crysta', 'Fortuner', 'Innova', 'Corolla', 'Camry'];
const assignedToList = ['Rizwan', 'Amit', 'Sohan', 'Rajesh'];
const addedByList = ['Admin', 'Manager', 'Staff'];

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke="#000000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownIcon = ({rotated}: {rotated: boolean}) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    style={rotated ? {transform: [{rotate: '180deg'}]} : undefined}>
    <Path
      d="M6 9L12 15L18 9"
      stroke="#E5383B"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronLeftIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M12 15L7 10L12 5"
      stroke="#333333"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M8 5L13 10L8 15"
      stroke="#333333"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path
      d="M3 7L6 10L11 4"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Dropdown Field ────────────────────────────────────────────────────────────

interface DropdownFieldProps {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  options: string[];
  onSelect: (v: string) => void;
  isGrid?: boolean;
}

function DropdownField({
  label,
  value,
  isOpen,
  onToggle,
  options,
  onSelect,
  isGrid = false,
}: DropdownFieldProps) {
  return (
    <View style={s.fieldWrap}>
      {!!value && <Text style={s.floatLabel}>{label}</Text>}
      <TouchableOpacity
        onPress={onToggle}
        style={[s.dropdownBtn, !!value && s.dropdownBtnFilled]}
        activeOpacity={0.8}>
        <Text style={[s.dropdownPlaceholder, !!value && s.dropdownValue]}>
          {value || label}
        </Text>
        <ChevronDownIcon rotated={isOpen} />
      </TouchableOpacity>
      {isOpen && (
        <View style={[s.dropdownList, isGrid && s.dropdownGrid]}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              style={[
                isGrid ? s.dropdownGridItem : s.dropdownListItem,
                value === opt && s.dropdownItemActive,
              ]}
              activeOpacity={0.7}>
              <Text
                style={[
                  s.dropdownItemText,
                  value === opt && s.dropdownItemActiveText,
                ]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FiltersOverlay({
  isOpen,
  onClose,
  onApply,
}: FiltersOverlayProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ActiveTab>('date');

  // Date state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [selectingField, setSelectingField] = useState<'start' | 'end'>('start');

  // Vehicle state
  const [showBrand, setShowBrand] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [showAssignedTo, setShowAssignedTo] = useState(false);
  const [showAddedBy, setShowAddedBy] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [addedBy, setAddedBy] = useState('');

  // Sort state
  const [sortBy, setSortBy] = useState<FilterData['sortBy']>(null);

  useEffect(() => {
    if (!isOpen) {
      setShowBrand(false);
      setShowModel(false);
      setShowAssignedTo(false);
      setShowAddedBy(false);
    }
  }, [isOpen]);

  const handleClearAll = () => {
    setStartDate('');
    setEndDate('');
    setSelectedDates([]);
    setBrand('');
    setModel('');
    setYear('');
    setVehicleNumber('');
    setAssignedTo('');
    setAddedBy('');
    setSortBy(null);
  };

  const handleApply = () => {
    onApply?.({
      startDate,
      endDate,
      brand,
      model,
      year,
      vehicleNumber,
      assignedTo,
      addedBy,
      sortBy,
    });
    onClose();
  };

  const getDaysInMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) =>
    new Date(y, m, 1).getDay();

  const handleDateSelect = (day: number) => {
    const dateStr = `${String(day).padStart(2, '0')}/${String(
      calendarMonth + 1,
    ).padStart(2, '0')}/${String(calendarYear).slice(-2)}`;
    if (selectingField === 'start') {
      setStartDate(dateStr);
      setSelectingField('end');
    } else {
      setEndDate(dateStr);
      setSelectingField('start');
    }
    setSelectedDates(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`e${i}`} style={cal.cell} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const sel = selectedDates.includes(day);
      cells.push(
        <TouchableOpacity
          key={day}
          onPress={() => handleDateSelect(day)}
          style={[cal.cell, sel && cal.cellSelected]}
          activeOpacity={0.7}>
          <Text style={[cal.dayText, sel && cal.dayTextSelected]}>{day}</Text>
        </TouchableOpacity>,
      );
    }
    return cells;
  };

  const closeAllDropdowns = () => {
    setShowBrand(false);
    setShowModel(false);
    setShowAssignedTo(false);
    setShowAddedBy(false);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[s.sheet, {paddingBottom: insets.bottom + 16}]}>
        {/* Drag handle */}
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={s.title}>Filters</Text>
        </View>

        {/* Tab row + Clear All */}
        <View style={s.tabRow}>
          <View style={s.tabGroup}>
            {(['date', 'vehicle', 'sort'] as ActiveTab[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
                activeOpacity={0.8}>
                <Text
                  style={[
                    s.tabBtnText,
                    activeTab === tab && s.tabBtnTextActive,
                  ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={handleClearAll}
            style={s.clearBtn}
            activeOpacity={0.8}>
            <Text style={s.clearBtnText}>CLEAR ALL</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}>

          {/* ── DATE TAB ──────────────────────────────────────────── */}
          {activeTab === 'date' && (
            <View style={s.tabContent}>
              {/* Start / End date fields */}
              <View style={s.dateRow}>
                <TouchableOpacity
                  onPress={() => setSelectingField('start')}
                  style={[
                    s.dateField,
                    selectingField === 'start' && s.dateFieldActive,
                  ]}
                  activeOpacity={0.8}>
                  <Text style={s.dateFieldLabel}>START</Text>
                  <Text
                    style={[
                      s.dateFieldValue,
                      !startDate && s.dateFieldPlaceholder,
                    ]}>
                    {startDate || 'DD/MM/YY'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectingField('end')}
                  style={[
                    s.dateField,
                    selectingField === 'end' && s.dateFieldActive,
                  ]}
                  activeOpacity={0.8}>
                  <Text style={s.dateFieldLabel}>END</Text>
                  <Text
                    style={[
                      s.dateFieldValue,
                      !endDate && s.dateFieldPlaceholder,
                    ]}>
                    {endDate || 'DD/MM/YY'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Calendar navigation */}
              <View style={s.calNav}>
                <View style={s.calNavGroup}>
                  <TouchableOpacity
                    onPress={() => setCalendarYear(y => y - 1)}
                    style={s.calNavBtn}>
                    <ChevronLeftIcon />
                  </TouchableOpacity>
                  <Text style={s.calNavText}>{calendarYear}</Text>
                  <TouchableOpacity
                    onPress={() => setCalendarYear(y => y + 1)}
                    style={s.calNavBtn}>
                    <ChevronRightIcon />
                  </TouchableOpacity>
                </View>

                <View style={s.calNavGroup}>
                  <TouchableOpacity
                    onPress={() =>
                      setCalendarMonth(m => (m === 0 ? 11 : m - 1))
                    }
                    style={s.calNavBtn}>
                    <ChevronLeftIcon />
                  </TouchableOpacity>
                  <Text style={[s.calNavText, s.calMonthText]}>
                    {monthNames[calendarMonth]}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setCalendarMonth(m => (m === 11 ? 0 : m + 1))
                    }
                    style={s.calNavBtn}>
                    <ChevronRightIcon />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day headers */}
              <View style={cal.row}>
                {dayHeaders.map((d, i) => (
                  <View key={i} style={cal.cell}>
                    <Text style={cal.headerText}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar days */}
              <View style={cal.grid}>{renderCalendarDays()}</View>
            </View>
          )}

          {/* ── VEHICLE TAB ───────────────────────────────────────── */}
          {activeTab === 'vehicle' && (
            <View style={s.tabContent}>
              <DropdownField
                label="Brand"
                value={brand}
                isOpen={showBrand}
                onToggle={() => {
                  closeAllDropdowns();
                  setShowBrand(v => !v);
                }}
                options={brandList}
                onSelect={v => {
                  setBrand(v);
                  setShowBrand(false);
                }}
                isGrid
              />

              <DropdownField
                label="Model"
                value={model}
                isOpen={showModel}
                onToggle={() => {
                  closeAllDropdowns();
                  setShowModel(v => !v);
                }}
                options={modelList}
                onSelect={v => {
                  setModel(v);
                  setShowModel(false);
                }}
              />

              <View
                style={[
                  s.fieldWrap,
                  s.inputFieldWrap,
                  !!year && s.inputFieldWrapActive,
                ]}>
                {!!year && <Text style={s.floatLabel}>Year</Text>}
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  placeholder="Year"
                  placeholderTextColor="#828282"
                  style={s.textInput}
                  keyboardType="numeric"
                />
              </View>

              <View
                style={[
                  s.fieldWrap,
                  s.inputFieldWrap,
                  !!vehicleNumber && s.inputFieldWrapActive,
                ]}>
                {!!vehicleNumber && (
                  <Text style={s.floatLabel}>Vehicle Number</Text>
                )}
                <TextInput
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  placeholder="Vehicle Number"
                  placeholderTextColor="#828282"
                  style={s.textInput}
                  autoCapitalize="characters"
                />
              </View>

              <DropdownField
                label="Assigned to"
                value={assignedTo}
                isOpen={showAssignedTo}
                onToggle={() => {
                  closeAllDropdowns();
                  setShowAssignedTo(v => !v);
                }}
                options={assignedToList}
                onSelect={v => {
                  setAssignedTo(v);
                  setShowAssignedTo(false);
                }}
              />

              <DropdownField
                label="Added by"
                value={addedBy}
                isOpen={showAddedBy}
                onToggle={() => {
                  closeAllDropdowns();
                  setShowAddedBy(v => !v);
                }}
                options={addedByList}
                onSelect={v => {
                  setAddedBy(v);
                  setShowAddedBy(false);
                }}
              />
            </View>
          )}

          {/* ── SORT TAB ──────────────────────────────────────────── */}
          {activeTab === 'sort' && (
            <View style={s.tabContent}>
              {(
                [
                  {
                    key: 'amount_low_high' as const,
                    label: 'Amount (Low To High)',
                  },
                  {
                    key: 'amount_high_low' as const,
                    label: 'Amount (High To Low)',
                  },
                  {key: 'relevance' as const, label: 'Relevance (Default)'},
                ] as {key: FilterData['sortBy']; label: string}[]
              ).map(opt => (
                <TouchableOpacity
                  key={String(opt.key)}
                  onPress={() =>
                    setSortBy(sortBy === opt.key ? null : opt.key)
                  }
                  style={s.sortRow}
                  activeOpacity={0.8}>
                  <View
                    style={[
                      s.checkbox,
                      sortBy === opt.key && s.checkboxActive,
                    ]}>
                    {sortBy === opt.key && <CheckIcon />}
                  </View>
                  <Text style={s.sortLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Apply button */}
        <View style={s.footer}>
          <TouchableOpacity
            onPress={handleApply}
            style={s.applyBtn}
            activeOpacity={0.85}>
            <Text style={s.applyBtnText}>APPLY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 19,
    elevation: 8,
  },
  handle: {
    width: 172,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 23,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  // Tab row
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
    borderRadius: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {backgroundColor: '#e5383b'},
  tabBtnText: {fontSize: 14, fontWeight: '500', color: '#4c4c4c'},
  tabBtnTextActive: {color: '#ffffff'},
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
  },
  clearBtnText: {color: '#e5383b', fontSize: 14, fontWeight: '500'},
  // Scroll
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 16},
  tabContent: {gap: 16, paddingVertical: 8},
  // Date fields
  dateRow: {flexDirection: 'row', gap: 12},
  dateField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateFieldActive: {borderColor: '#e5383b'},
  dateFieldLabel: {
    fontSize: 10,
    color: '#828282',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateFieldValue: {fontSize: 15, color: '#000000'},
  dateFieldPlaceholder: {color: '#828282'},
  // Calendar navigation
  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calNavGroup: {flexDirection: 'row', alignItems: 'center', gap: 8},
  calNavBtn: {padding: 4},
  calNavText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    minWidth: 50,
    textAlign: 'center',
  },
  calMonthText: {minWidth: 100},
  // Dropdown field
  fieldWrap: {position: 'relative'},
  floatLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    fontSize: 10,
    color: '#828282',
    zIndex: 1,
  },
  dropdownBtn: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBtnFilled: {borderColor: '#e5383b'},
  dropdownPlaceholder: {fontSize: 15, color: '#828282'},
  dropdownValue: {color: '#000000'},
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    padding: 12,
    gap: 8,
    overflow: 'visible',
  },
  dropdownListItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownGridItem: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: '#fff5f5',
    borderWidth: 1.5,
    borderColor: '#e5383b',
  },
  dropdownItemText: {fontSize: 14, color: '#333333'},
  dropdownItemActiveText: {color: '#e5383b', fontWeight: '600'},
  // Text input fields
  inputFieldWrap: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputFieldWrapActive: {borderColor: '#e5383b'},
  textInput: {
    fontSize: 15,
    color: '#000000',
    padding: 0,
  },
  // Sort tab
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d3d3d3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {borderColor: '#e5383b', backgroundColor: '#e5383b'},
  sortLabel: {fontSize: 15, color: '#000000'},
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  applyBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#e5383b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '400',
    textTransform: 'uppercase',
  },
});

const cal = StyleSheet.create({
  row: {flexDirection: 'row'},
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  cell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: '#e5383b',
    borderRadius: 20,
  },
  headerText: {fontSize: 14, fontWeight: '500', color: '#828282'},
  dayText: {fontSize: 14, fontWeight: '500', color: '#333333'},
  dayTextSelected: {color: '#ffffff'},
});
