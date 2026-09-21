import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import Card from './Card';

const ActivityList = ({ activities }) => {
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.dot} />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.header}>Recent Activities</Text>
      <FlatList
        data={activities}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginTop: SPACING.md,
  },
  header: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: SPACING.sm,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: SPACING.md,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text,
  },
  time: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default ActivityList;
