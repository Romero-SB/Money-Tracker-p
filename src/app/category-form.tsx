import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ColorPicker } from '@/components/pickers/color-picker';
import { IconPicker } from '@/components/pickers/icon-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptionChips } from '@/components/ui/option-chips';
import { Screen } from '@/components/ui/screen';
import { AppTextInput, FormField } from '@/components/ui/text-input';
import { ThemedText } from '@/components/ui/themed-text';
import { CATEGORY_ICONS, CATEGORY_TYPE_OPTIONS, type IconName } from '@/constants/options';
import { Spacing } from '@/constants/theme';
import { useRepositories } from '@/hooks/use-repositories';
import { useCategories } from '@/hooks/use-categories';
import type { CategoryType } from '@/types/models';

export default function CategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null;

  const { categories: categoriesRepo } = useRepositories();
  const { create, update, remove } = useCategories();
  const [category, setCategory] = useState<{ id: number; is_default: 0 | 1 } | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState<IconName>('pricetag');
  const [color, setColor] = useState('#0D9488');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingId === null) {
      return;
    }
    let cancelled = false;
    categoriesRepo.getById(editingId).then((result) => {
      if (cancelled || !result) {
        return;
      }
      setCategory({ id: result.id, is_default: result.is_default });
      setName(result.name);
      setType(result.type);
      setIcon(result.icon as IconName);
      setColor(result.color);
    });
    return () => {
      cancelled = true;
    };
  }, [editingId, categoriesRepo]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Datos incompletos', 'Escribe un nombre para la categoría.');
      return;
    }

    try {
      setSaving(true);
      if (editingId !== null) {
        await update(editingId, { name, icon, color });
      } else {
        await create({ name, type, icon, color });
      }
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la categoría. Verifica que no exista otra con el mismo nombre y tipo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!category) {
      return;
    }
    Alert.alert(
      'Eliminar categoría',
      'Los movimientos que usen esta categoría quedarán sin categoría. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(category.id);
              router.back();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la categoría.');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEditing ? 'Editar categoría' : 'Nueva categoría' }} />

      <View style={styles.form}>
        <Card style={styles.card}>
          <AppTextInput
            label="Nombre"
            placeholder="Ej: Alimentación, Salario"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={40}
          />
          <FormField label="Tipo">
            <OptionChips
              options={CATEGORY_TYPE_OPTIONS}
              value={type}
              onChange={setType}
              disabled={isEditing}
            />
            {isEditing ? (
              <ThemedText variant="tiny" color="faint">
                El tipo no se puede cambiar en una categoría existente.
              </ThemedText>
            ) : null}
          </FormField>
        </Card>

        <Card style={styles.card}>
          <FormField label="Icono">
            <IconPicker value={icon} onChange={setIcon} icons={CATEGORY_ICONS} accentColor={color} />
          </FormField>
          <FormField label="Color">
            <ColorPicker value={color} onChange={setColor} />
          </FormField>
        </Card>

        <Button label={isEditing ? 'Guardar cambios' : 'Crear categoría'} onPress={handleSave} loading={saving} />

        {category && category.is_default ? (
          <ThemedText variant="tiny" color="faint" style={styles.note}>
            Las categorías predeterminadas no se pueden eliminar.
          </ThemedText>
        ) : category ? (
          <Button label="Eliminar categoría" variant="danger" onPress={handleDelete} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.lg,
  },
  note: {
    textAlign: 'center',
  },
});
