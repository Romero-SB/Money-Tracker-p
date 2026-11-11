import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { OptionChips } from '@/components/ui/option-chips';
import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { CATEGORY_TYPE_OPTIONS } from '@/constants/options';
import { Colors, Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import type { CategoryType } from '@/types/models';

export default function CategoriesScreen() {
  const { categories, error } = useCategories();
  const [filter, setFilter] = useState<CategoryType>('expense');

  const filtered = useMemo(
    () => (categories ?? []).filter((category) => category.type === filter),
    [categories, filter]
  );

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Categorías' }} />

      <OptionChips options={CATEGORY_TYPE_OPTIONS} value={filter} onChange={setFilter} />

      {categories === null && !error ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : error ? (
        <ThemedText color="expense" style={styles.center}>
          {error}
        </ThemedText>
      ) : filtered.length === 0 ? (
        <Placeholder
          icon="pricetags"
          title="Sin categorías"
          message="Crea categorías para organizar tus gastos e ingresos."
        />
      ) : (
        <Card style={styles.listCard}>
          {filtered.map((category) => (
            <ListRow
              key={category.id}
              icon={category.icon}
              color={category.color}
              title={category.name}
              subtitle={category.is_default ? 'Predeterminada' : 'Personalizada'}
              onPress={() => router.push({ pathname: '/category-form', params: { id: category.id } })}
            />
          ))}
        </Card>
      )}

      <Button label="Nueva categoría" onPress={() => router.push('/category-form')} style={styles.addButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: Spacing.xxl,
  },
  center: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  listCard: {
    paddingVertical: Spacing.xs,
    marginTop: Spacing.lg,
  },
  addButton: {
    marginTop: Spacing.lg,
  },
});
