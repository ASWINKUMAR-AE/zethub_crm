import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import API from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const ClientPaymentsScreen = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayableMilestones();
  }, []);

  const fetchPayableMilestones = async () => {
    try {
      setLoading(true);
      const projRes = await API.get('/projects');
      
      let allMilestones = [];
      for (const p of projRes.data) {
        const msRes = await API.get(`/milestones/project/${p.id}`);
        allMilestones = [...allMilestones, ...msRes.data];
      }
      
      // Clients only see approved/paid milestones in payments
      const payables = allMilestones.filter(m => m.status === 'approved' || m.status === 'paid');
      setMilestones(payables);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCheckout = async (milestone) => {
    try {
      Alert.alert(
        'Processing Payment', 
        `Redirecting to Razorpay for milestone: ${milestone.title}\nAmount: ₹${milestone.amount}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mock Pay Now', onPress: () => processMockPayment(milestone) }
        ]
      );
    } catch (e) {
      Alert.alert('Checkout Error', e.message);
    }
  };

  const processMockPayment = async (milestone) => {
    try {
      // 1. Create Order via Razorpay mock
      const orderRes = await API.post('/payments/order', {
        milestone_id: milestone.id,
        amount: milestone.amount,
      });

      // 2. Mock client-side success and Verify
      await API.post('/payments/verify', {
        milestone_id: milestone.id,
        client_id: milestone.project_id, // technically the client_id mapping should happen correctly here
        amount: milestone.amount,
        razorpay_order_id: orderRes.data.id,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature'
      });

      Alert.alert('Payment Successful!', 'Thank you for your payment.');
      fetchPayableMilestones();
    } catch (e) {
      Alert.alert('Payment Error', 'Payment verification failed.');
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Badge status={item.status === 'paid' ? 'success' : 'pending'} text={item.status === 'paid' ? 'Paid' : 'Unpaid'} />
      </View>
      <Text style={styles.amount}>₹ {item.amount}</Text>
      
      {item.status === 'approved' && (
        <Button 
          title="Pay with Razorpay" 
          onPress={() => handlePaymentCheckout(item)} 
          style={styles.actionBtn} 
        />
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment History & Invoices</Text>
      <Text style={styles.subtitle}>Settle pending milestone payments.</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={milestones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No invoices pending.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  card: { marginBottom: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  taskTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, flex: 1 },
  amount: { ...TYPOGRAPHY.h2, color: COLORS.primary, marginTop: SPACING.xs },
  actionBtn: { marginTop: SPACING.md, alignSelf: 'flex-start' },
  empty: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.lg }
});

export default ClientPaymentsScreen;
