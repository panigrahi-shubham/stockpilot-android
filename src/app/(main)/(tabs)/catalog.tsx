import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Share, Text, TextInput, View, useWindowDimensions, type TextInputInstance } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { useT } from '@/i18n';
import { api, errorMessage } from '@/data/api';
import { BRANDS, CATEGORIES, CategoryId, Product } from '@/data/catalog';
import { inr } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, Checkbox, Chip, EmptyState, ErrorState, ListRow, RadioGroup, Skeleton, SwitchRow } from '@/components/ui';
import { ProductCard } from '@/components/ProductCard';
import { Sheet, useToast } from '@/components/overlays';

type Sort = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'discount';
interface Filters {
  maxPrice: number;
  brands: string[];
  inStockOnly: boolean;
  favoritesOnly: boolean;
}
const PRICE_CAP = 3000;
const DEFAULT_FILTERS: Filters = { maxPrice: PRICE_CAP, brands: [], inStockOnly: false, favoritesOnly: false };

const SORTS: { value: Sort; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer rating' },
  { value: 'discount', label: 'Biggest discount' },
];

export default function Catalog() {
  const { c } = useTheme();
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ focus?: string; category?: string; q?: string; favorites?: string }>();
  const { state, actions } = useApp();
  const [search, setSearch] = useState(params.q ?? '');
  const [query, setQuery] = useState(params.q ?? '');
  const [focused, setFocused] = useState(false);
  const [category, setCategory] = useState<CategoryId | 'all'>((params.category as CategoryId) ?? 'all');
  const [sort, setSort] = useState<Sort>('relevance');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [quick, setQuick] = useState<Product | null>(null);
  const inputRef = useRef<TextInputInstance>(null);
  const reqId = useRef(0);
  const layout = state.settings.compactCatalog ? 'list' : 'grid';
  const activeFilterCount =
    (filters.maxPrice < PRICE_CAP ? 1 : 0) + (filters.brands.length ? 1 : 0) + (filters.inStockOnly ? 1 : 0) + (filters.favoritesOnly ? 1 : 0);

  useEffect(() => {
    if (params.focus) setTimeout(() => inputRef.current?.focus(), 350);
  }, [params.focus]);
  useEffect(() => {
    if (params.category) setCategory(params.category as CategoryId);
  }, [params.category]);
  useEffect(() => {
    if (params.favorites) setFilters((f) => ({ ...f, favoritesOnly: true }));
  }, [params.favorites]);

  // Debounce typing → query (400ms), like a real search box.
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(
    async (p: number) => {
      const my = ++reqId.current;
      if (p === 1) {
        setLoading(true);
        setError(null);
      } else setLoadingMore(true);
      try {
        const res = await api.products({
          page: p,
          search: query,
          category,
          sort,
          maxPrice: filters.maxPrice < PRICE_CAP ? filters.maxPrice : undefined,
          brands: filters.brands,
          inStockOnly: filters.inStockOnly,
          favoritesOnly: filters.favoritesOnly ? state.favorites : undefined,
        });
        if (my !== reqId.current) return; // stale response
        setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(p);
      } catch (e) {
        if (my !== reqId.current) return;
        if (p === 1) setError(errorMessage(e));
        else onError(e);
      } finally {
        if (my === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, category, sort, filters, onError],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const colW = (width - 16 * 2 - 12) / 2;

  const header = (
    <View style={{ gap: 12, paddingBottom: 12 }}>
      <ScrollView testID="catalog-category-chips" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        <Chip testID="catalog-category-all" label="All" selected={category === 'all'} onPress={() => setCategory('all')} />
        {CATEGORIES.map((cat) => (
          <Chip key={cat.id} testID={`catalog-category-${cat.id}`} label={cat.name} selected={category === cat.id} onPress={() => setCategory(cat.id)} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 }}>
        <Text testID="catalog-results-count" style={[font.small, { color: c.textMuted, flex: 1 }]}>
          {loading ? 'Searching…' : `${total} product${total === 1 ? '' : 's'}${query ? ` for “${query}”` : ''}`}
        </Text>
        <Pressable testID="catalog-sort-button" accessibilityRole="button" accessibilityLabel={`Sort: ${SORTS.find((s) => s.value === sort)?.label}`} onPress={() => setSortOpen(true)} style={toolBtn(c)}>
          <Ionicons name="swap-vertical" size={15} color={c.text} />
          <Text style={[font.small, { color: c.text, fontWeight: '700' }]}>Sort</Text>
        </Pressable>
        <Pressable testID="catalog-filter-button" accessibilityRole="button" accessibilityLabel={`Filters, ${activeFilterCount} active`} onPress={() => setFilterOpen(true)} style={toolBtn(c)}>
          <Ionicons name="funnel-outline" size={15} color={c.text} />
          <Text style={[font.small, { color: c.text, fontWeight: '700' }]}>Filter</Text>
          {activeFilterCount ? (
            <View testID="catalog-filter-count" style={{ backgroundColor: c.primary, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: c.onPrimary, fontSize: 10, fontWeight: '800' }}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          testID="catalog-layout-toggle"
          accessibilityRole="button"
          accessibilityLabel={layout === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          onPress={() => actions.setSettings({ compactCatalog: layout === 'grid' })}
          style={[toolBtn(c), { paddingHorizontal: 9 }]}
        >
          <Ionicons name={layout === 'grid' ? 'list-outline' : 'grid-outline'} size={16} color={c.text} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen testID="catalog-screen">
      <AppHeader testID="catalog-header" mode="menu" title={t('tab.catalog')} showBell />
      <View style={{ backgroundColor: c.card, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
        <View style={{ height: 46, borderRadius: radius.md, borderWidth: 1.5, borderColor: focused ? c.primary : c.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, backgroundColor: c.cardAlt }}>
          <Ionicons name="search" size={18} color={c.textFaint} />
          <TextInput
            ref={inputRef}
            testID="catalog-search-input"
            accessibilityLabel="Search products"
            placeholder={t('common.search')}
            placeholderTextColor={c.textFaint}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            onSubmitEditing={() => search.trim() && actions.pushRecentSearch(search.trim())}
            style={[font.body, { flex: 1, color: c.text, fontSize: 15 }]}
          />
          {search ? (
            <Pressable testID="catalog-search-clear" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={c.textFaint} />
            </Pressable>
          ) : null}
        </View>
        {focused && !search && state.recentSearches.length ? (
          <View testID="catalog-recent-searches" style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={[font.small, { color: c.textMuted, fontWeight: '700' }]}>RECENT SEARCHES</Text>
              <Pressable testID="catalog-recent-clear" onPress={actions.clearRecentSearches}>
                <Text style={[font.small, { color: c.primary, fontWeight: '700' }]}>Clear</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {state.recentSearches.map((r, i) => (
                <Chip key={r} testID={`catalog-recent-search-${i}`} label={r} icon="time-outline" onPress={() => setSearch(r)} />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {error ? (
        <>
          {header}
          <ErrorState testID="catalog-error" message={error} onRetry={() => load(1)} />
        </>
      ) : loading ? (
        <>
          {header}
          <View testID="catalog-skeleton" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ width: colW, backgroundColor: c.card, borderRadius: radius.lg, padding: 10, gap: 8 }}>
                <Skeleton width={colW - 20} height={colW - 20} />
                <Skeleton width="90%" height={14} />
                <Skeleton width="60%" height={12} />
                <Skeleton width="100%" height={34} />
              </View>
            ))}
          </View>
        </>
      ) : (
        <FlatList
          key={layout}
          testID="catalog-list"
          data={items}
          numColumns={layout === 'grid' ? 2 : 1}
          keyExtractor={(p) => p.sku}
          ListHeaderComponent={header}
          columnWrapperStyle={layout === 'grid' ? { gap: 12, paddingHorizontal: 16 } : undefined}
          contentContainerStyle={{ gap: 12, paddingBottom: 40, paddingHorizontal: layout === 'list' ? 0 : 0 }}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <View style={layout === 'list' ? { paddingHorizontal: 16 } : { width: colW }}>
              <ProductCard product={item} layout={layout} width={colW} onLongPress={setQuick} />
            </View>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) load(page + 1);
          }}
          ListEmptyComponent={
            <EmptyState
              testID="catalog-empty"
              icon="search"
              title="No products found"
              subtitle={query ? `We couldn’t find anything for “${query}”. Try a different keyword or clear filters.` : 'Try removing some filters.'}
              action="Clear search & filters"
              onAction={() => {
                setSearch('');
                setFilters(DEFAULT_FILTERS);
                setCategory('all');
              }}
            />
          }
          ListFooterComponent={
            items.length ? (
              loadingMore ? (
                <View testID="catalog-loading-more" style={{ padding: 18, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                  <ActivityIndicator color={c.primary} />
                  <Text style={[font.small, { color: c.textMuted }]}>Loading more products…</Text>
                </View>
              ) : !hasMore ? (
                <Text testID="catalog-end-of-list" style={[font.small, { color: c.textFaint, textAlign: 'center', padding: 18 }]}>
                  You’ve seen all {total} products
                </Text>
              ) : undefined
            ) : undefined
          }
        />
      )}

      {state.compare.length ? (
        <View testID="catalog-compare-bar" style={{ position: 'absolute', left: 16, right: 16, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.text, borderRadius: radius.lg, padding: 10, paddingLeft: 16, elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 }}>
          <Ionicons name="git-compare-outline" size={18} color={c.card} />
          <Text testID="catalog-compare-count" style={[font.bodyStrong, { color: c.card, flex: 1 }]}>
            {state.compare.length} selected to compare
          </Text>
          <Pressable testID="catalog-compare-clear" accessibilityRole="button" onPress={actions.clearCompare} hitSlop={6}>
            <Text style={[font.small, { color: c.card, opacity: 0.8 }]}>Clear</Text>
          </Pressable>
          <Pressable testID="catalog-compare-open" accessibilityRole="button" onPress={() => router.push('/compare')} style={{ backgroundColor: c.accent, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={[font.small, { color: '#2B1B00', fontWeight: '800' }]}>COMPARE</Text>
          </Pressable>
        </View>
      ) : null}

      <Sheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sort by" testID="catalog-sort-sheet">
        <RadioGroup
          testID="catalog-sort-option"
          value={sort}
          onChange={(v) => {
            setSort(v);
            setSortOpen(false);
          }}
          options={SORTS}
        />
      </Sheet>

      <FilterSheet
        visible={filterOpen}
        initial={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
        }}
      />

      <Sheet visible={!!quick} onClose={() => setQuick(null)} title={quick?.name ?? ''} testID="catalog-quick-actions">
        {quick ? (
          <View>
            <ListRow
              testID="quick-action-favorite"
              icon={state.favorites.includes(quick.sku) ? 'heart' : 'heart-outline'}
              title={state.favorites.includes(quick.sku) ? 'Remove from favourites' : 'Add to favourites'}
              onPress={() => {
                actions.toggleFavorite(quick.sku);
                toast.show(state.favorites.includes(quick.sku) ? 'Removed from favourites' : 'Added to favourites', 'success');
                setQuick(null);
              }}
            />
            <ListRow
              testID="quick-action-compare"
              icon="git-compare-outline"
              title={state.compare.includes(quick.sku) ? 'Remove from compare' : state.compare.length >= 3 ? 'Add to compare (replaces oldest)' : 'Add to compare'}
              onPress={() => {
                const had = state.compare.includes(quick.sku);
                actions.toggleCompare(quick.sku);
                toast.show(had ? 'Removed from compare' : 'Added to compare', 'success');
                setQuick(null);
              }}
            />
            <ListRow
              testID="quick-action-quick-list"
              icon="flash-outline"
              title="Add to quick order list"
              onPress={() => {
                actions.addToQuickList(quick.sku, quick.moq);
                toast.show('Added to quick order list', 'success');
                setQuick(null);
              }}
            />
            <ListRow
              testID="quick-action-share"
              icon="share-social-outline"
              title="Share product"
              onPress={() => {
                const p = quick;
                setQuick(null);
                Share.share({ message: `${p.name} – ${inr(p.price)} on StockPilot B2B\nstockpilot://product/${p.sku}` }).catch(() => {});
              }}
            />
            <ListRow
              testID="quick-action-details"
              icon="information-circle-outline"
              title="View details"
              onPress={() => {
                const sku = quick.sku;
                setQuick(null);
                router.push(`/product/${sku}`);
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function toolBtn(c: ReturnType<typeof useTheme>['c']) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
  };
}

function FilterSheet({ visible, initial, onClose, onApply }: { visible: boolean; initial: Filters; onClose: () => void; onApply: (f: Filters) => void }) {
  const { c } = useTheme();
  const [f, setF] = useState<Filters>(initial);
  useEffect(() => {
    if (visible) setF(initial);
  }, [visible, initial]);
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      testID="catalog-filter-sheet"
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button testID="filter-reset-button" title="Reset" variant="secondary" style={{ flex: 1 }} onPress={() => setF(DEFAULT_FILTERS)} />
          <Button testID="filter-apply-button" title="Apply filters" style={{ flex: 2 }} onPress={() => onApply(f)} />
        </View>
      }
    >
      <ScrollView testID="filter-scroll" style={{ maxHeight: 460 }}>
        <Text style={[font.h3, { color: c.text, marginTop: 4 }]}>Max price per pack</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={[font.small, { color: c.textMuted }]}>₹100</Text>
          <Text testID="filter-price-value" style={[font.bodyStrong, { color: c.primary }]}>
            {f.maxPrice >= PRICE_CAP ? 'Any price' : `Up to ${inr(f.maxPrice, { decimals: false })}`}
          </Text>
          <Text style={[font.small, { color: c.textMuted }]}>₹3,000+</Text>
        </View>
        <Slider
          testID="filter-price-slider"
          accessibilityLabel="Maximum price"
          minimumValue={100}
          maximumValue={PRICE_CAP}
          step={50}
          value={f.maxPrice}
          onValueChange={(v) => setF((x) => ({ ...x, maxPrice: v }))}
          minimumTrackTintColor={c.primary}
          maximumTrackTintColor={c.border}
          thumbTintColor={c.primary}
          style={{ height: 40 }}
        />
        <SwitchRow testID="filter-in-stock-switch" label="In stock only" value={f.inStockOnly} onValueChange={(v) => setF((x) => ({ ...x, inStockOnly: v }))} />
        <SwitchRow testID="filter-favorites-switch" label="My favourites only" value={f.favoritesOnly} onValueChange={(v) => setF((x) => ({ ...x, favoritesOnly: v }))} />
        <Text style={[font.h3, { color: c.text, marginTop: 10, marginBottom: 4 }]}>Brands</Text>
        {BRANDS.map((b) => (
          <Checkbox
            key={b}
            testID={`filter-brand-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            label={b}
            checked={f.brands.includes(b)}
            onChange={(on) => setF((x) => ({ ...x, brands: on ? [...x.brands, b] : x.brands.filter((y) => y !== b) }))}
          />
        ))}
        <View style={{ height: 10 }} />
      </ScrollView>
    </Sheet>
  );
}
