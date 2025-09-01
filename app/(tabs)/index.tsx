import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';  // Importer useRouter pour gérer la navigation

export default function HomeScreen() {
  const router = useRouter();  // Initialiser useRouter

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* NAVBAR personnalisée */}
        <View style={styles.navbar}>
          <View style={styles.left}>
            <Ionicons name="home" size={24} color="#007bff" />
            <Text style={styles.title}>Home</Text>
          </View>
          <View style={styles.right}>
            <TouchableOpacity onPress={() => alert('Search')}>
              <Ionicons name="search" size={24} color="#28a745" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => alert('Notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#ffc107" style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => alert('Settings')}>
              <MaterialIcons name="settings" size={24} color="#dc3545" style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* IMAGE de la facture */}
        <View style={styles.imageContainer}>
          <Image
            source={require('./image1.png')} // Assurez-vous que le chemin est correct
            style={styles.invoiceImage}
          />
        </View>

        {/* Tableau de bord */}
        <View style={styles.dashboard}>
          <Text style={styles.dashboardTitle}>Invoice Dashboard</Text>
          <Text style={styles.subTitle}>Manage your invoices efficiently</Text>
          <View style={styles.dashboardStats}>
            {/* Première ligne des stats */}
            <View style={styles.row}>
              <View style={[styles.statCard, styles.pending]}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={[styles.statValue, styles.pendingValue]}>5</Text>
              </View>
              <View style={[styles.statCard, styles.validated]}>
                <Text style={styles.statLabel}>Validated</Text>
                <Text style={[styles.statValue, styles.validatedValue]}>12</Text>
              </View>
            </View>
            {/* Deuxième ligne des stats */}
            <View style={styles.row}>
              <View style={[styles.statCard, styles.paid]}>
                <Text style={styles.statLabel}>Paid</Text>
                <Text style={[styles.statValue, styles.paidValue]}>8</Text>
              </View>
              <View style={[styles.statCard, styles.urgent]}>
                <Text style={styles.statLabel}>Urgent</Text>
                <Text style={[styles.statValue, styles.urgentValue]}>2</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Boutons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButtonAdd} 
            onPress={() => router.push('/add-invoice')}  // Utilise useRouter pour naviguer vers add-invoice.tsx
          >
            <Text style={styles.actionButtonText}>Add Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButtonView} 
            onPress={() => router.push('/invoices')}  // Utilise useRouter pour naviguer vers invoices.tsx
          >
            <Text style={styles.actionButtonText}>View Invoices</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4e555b',
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  icon: {
    marginLeft: 12,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  invoiceImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    opacity: 0.95,
  },
  dashboard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  dashboardStats: {
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#f1f3f5',
    padding: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    opacity: 0.9,
  },
  statLabel: {
    fontSize: 16,
    color: '#000',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  pending: {
    backgroundColor: '#8f9aff',
  },
  validated: {
    backgroundColor: '#82d3a5',
  },
  paid: {
    backgroundColor: '#e1a7e6',
  },
  urgent: {
    backgroundColor: '#f5b7b1',
  },
  pendingValue: {
    color: '#2c3e50',
  },
  validatedValue: {
    color: '#1e7e34',
  },
  paidValue: {
    color: '#6a2a7f',
  },
  urgentValue: {
    color: '#c0392b',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10, // Ou utilise marginLeft sur le 2e bouton si ton RN est ancien
    marginBottom: 20,
  },
  actionButtonAdd: {
    backgroundColor: '#336699',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: 160,
    alignItems: 'center',
  },
  actionButtonView: {
    backgroundColor: '#336699',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: 180,
    height: 50,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
