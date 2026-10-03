import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { CloseCircleIcon } from './icons';
import {
  EMPTY_FILTERS,
  FILTER_SECTIONS,
  getSelectedChips,
  removeSelection,
  type FilterOption,
  type FilterSectionKey,
  type FilterSelections,
  type SortOption,
} from './filterConfig';

interface FiltersOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selections: FilterSelections;
  onApply: (selections: FilterSelections) => void;
  initialSection?: FilterSectionKey;
}

type SvgLogo = React.FC<{ width?: number; height?: number }>;

const SearchGlyph = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke="#4b5563" strokeWidth={2} />
    <Path
      d="M20 20L16.5 16.5"
      stroke="#4b5563"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const SmallX = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#161a1d" strokeWidth={1.8} />
    <Path
      d="M15 9L9 15M9 9L15 15"
      stroke="#161a1d"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

const CheckMark = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 13L9.5 17.5L19 7"
      stroke="#ffffff"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

function OptionLogo({
  logo,
  size,
}: {
  logo?: FilterOption['logo'];
  size: number;
}) {
  if (!logo) return null;
  if (typeof logo === 'number' || typeof logo === 'object') {
    return (
      <Image
        source={logo}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
  const Logo = logo as SvgLogo;
  return <Logo width={size} height={size} />;
}

export default function FiltersOverlay({
  isOpen,
  onClose,
  selections,
  onApply,
  initialSection = 'brands',
}: FiltersOverlayProps) {
  const [draft, setDraft] = useState<FilterSelections>(selections);
  const [activeKey, setActiveKey] = useState<FilterSectionKey>(initialSection);
  const [query, setQuery] = useState('');

  // Start each session from the applied filters; edits are only committed on Apply.
  useEffect(() => {
    if (isOpen) {
      setDraft(selections);
      setActiveKey(initialSection);
      setQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const q = query.trim().toLowerCase();

  const visibleSections = useMemo(
    () =>
      FILTER_SECTIONS.map(section => ({
        ...section,
        options: q
          ? section.options.filter(o => o.label.toLowerCase().includes(q))
          : section.options,
      })).filter(section => !q || section.options.length > 0),
    [q],
  );

  const activeSection =
    visibleSections.find(s => s.key === activeKey) ?? visibleSections[0];

  const chips = getSelectedChips(draft);

  const isSelected = (key: FilterSectionKey, value: string) =>
    key === 'sort'
      ? draft.sort === value
      : (draft[key] as string[]).includes(value);

  const toggle = (key: FilterSectionKey, value: string) => {
    setDraft(prev => {
      if (key === 'sort') {
        return {
          ...prev,
          sort: prev.sort === value ? null : (value as SortOption),
        };
      }
      const current = prev[key] as string[];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value],
      };
    });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdropTap}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={8}>
              <CloseCircleIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <SearchGlyph />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search across filters..."
              placeholderTextColor="#6b7280"
              style={styles.searchInput}
            />
          </View>

          {chips.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsRow}
            >
              {chips.map(chip => (
                <View
                  key={`${chip.sectionKey}-${chip.value}`}
                  style={styles.chip}
                >
                  <OptionLogo logo={chip.logo} size={14} />
                  <Text style={styles.chipText}>{chip.label}</Text>
                  <TouchableOpacity
                    hitSlop={6}
                    activeOpacity={0.7}
                    onPress={() =>
                      setDraft(prev =>
                        removeSelection(prev, chip.sectionKey, chip.value),
                      )
                    }
                  >
                    <SmallX />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.body}>
            <View style={styles.tabs}>
              {visibleSections.map(section => {
                const active = section.key === activeSection?.key;
                return (
                  <TouchableOpacity
                    key={section.key}
                    activeOpacity={0.8}
                    style={[styles.tab, active && styles.tabActive]}
                    onPress={() => setActiveKey(section.key)}
                  >
                    <Text
                      style={[styles.tabText, active && styles.tabTextActive]}
                    >
                      {section.title}
                    </Text>
                    {active && <View style={styles.tabBar} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView
              style={styles.options}
              contentContainerStyle={styles.optionsContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {activeSection ? (
                activeSection.options.map(option => {
                  const checked = isSelected(activeSection.key, option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.7}
                      style={[
                        styles.optionRow,
                        option.logo ? styles.optionRowLogo : null,
                      ]}
                      onPress={() => toggle(activeSection.key, option.value)}
                    >
                      {option.logo ? (
                        <View style={styles.logoBox}>
                          <OptionLogo logo={option.logo} size={34} />
                        </View>
                      ) : null}
                      <Text style={styles.optionLabel} numberOfLines={1}>
                        {option.label}
                        {option.count !== undefined && (
                          <Text
                            style={styles.optionCount}
                          >{`  (${option.count})`}</Text>
                        )}
                      </Text>
                      <View
                        style={[
                          styles.checkbox,
                          checked && styles.checkboxChecked,
                        ]}
                      >
                        {checked && <CheckMark />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No filters found</Text>
              )}
            </ScrollView>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerBtn, styles.clearBtn]}
              activeOpacity={0.8}
              onPress={() => setDraft(EMPTY_FILTERS)}
            >
              <Text style={styles.clearBtnText}>Clear Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerBtn, styles.applyBtn]}
              activeOpacity={0.85}
              onPress={handleApply}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropTap: { flex: 1 },
  sheet: {
    height: '80%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d9d9d9',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#161a1d' },
  searchBox: {
    height: 40,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#161a1d', padding: 0 },
  chipsScroll: { flexGrow: 0, marginTop: 10 },
  chipsRow: { paddingHorizontal: 16, gap: 8 },
  chip: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fdeaea',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  chipText: { fontSize: 13, color: '#161a1d' },
  body: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  tabs: { width: '34%', borderRightWidth: 1, borderRightColor: '#eeeeee' },
  tab: { height: 46, paddingHorizontal: 14, justifyContent: 'center' },
  tabActive: { backgroundColor: '#f6d4d4' },
  tabText: { fontSize: 13, color: '#161a1d' },
  tabTextActive: { color: '#e5383b', fontWeight: '600' },
  tabBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#e5383b',
  },
  options: { flex: 1 },
  optionsContent: { paddingHorizontal: 14, paddingVertical: 6 },
  optionRow: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  optionRowLogo: { minHeight: 58 },
  logoBox: { width: 40, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { flex: 1, fontSize: 13, color: '#161a1d' },
  optionCount: { color: '#6b7280' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#e5383b' },
  emptyText: {
    fontSize: 14,
    color: '#99a2b6',
    paddingTop: 24,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  footerBtn: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  clearBtnText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  applyBtn: { backgroundColor: '#e5383b' },
  applyBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
});
