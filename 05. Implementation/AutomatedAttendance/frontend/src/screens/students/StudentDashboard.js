import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { API_URL } from '../../config';
import CustomAlert from '../../components/CustomAlert';
import { colors, spacing, typography, shadows, borderRadius } from '../../config/theme';

const { width } = Dimensions.get('window');

const projectColors = {
  navy: '#1a237e',
  orange: '#ff5722',
  white: '#FFFFFF',
  lightGray: '#f5f6fa',
  darkGray: '#333333',
  mediumGray: '#666666',
};

const StudentDashboard = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const studentData = route.params?.studentData || {};
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    rate: 0,
  });
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

  // New state for QR code generator:
  const [qrInput, setQrInput] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchAttendanceStats();
  }, []);

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setTimeout(() => {
        setCourses([
          { id: '1', code: 'OOP', name: 'OBJECT ORIENTED PROGRAMMING', instructor: 'Dr. PINACA' },
          { id: '2', code: 'MATH201', name: 'Calculus II', instructor: 'Prof. Johnson' },
          { id: '3', code: 'ENG102', name: 'Academic Writing', instructor: 'Dr. Williams' },
          { id: '4', code: 'PHYS101', name: 'Physics I', instructor: 'Prof. Brown' },
          { id: '5', code: 'CHEM101', name: 'General Chemistry', instructor: 'Dr. Davis' },
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setIsLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      setTimeout(() => {
        setAttendanceStats({
          present: 0,
          absent: 0,
          total: 0,
          rate: 0,
        });
      }, 1000);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);

              const response = await axios.post(`${API_URL}/api/students/logout`, {
                studentId: studentData.idNumber,
              });

              if (response.data.success) {
                await AsyncStorage.multiRemove(['studentId', 'studentName', 'userType']);

                showAlert('Success', 'Logged out successfully', 'success');
                setTimeout(() => {
                  navigation.replace('Login');
                }, 1500);
              } else {
                throw new Error(response.data.message || 'Logout failed');
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to logout');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderCourseItem = ({ item }) => (
    <View style={styles.courseItem}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseCode}>{item.code}</Text>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.courseName}>{item.name}</Text>
      <Text style={styles.instructorName}>Instructor: {item.instructor}</Text>
    </View>
  );

  const renderDashboardTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Attendance Rate</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.rate}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Courses</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={projectColors.orange} style={styles.loader} />
      ) : courses.length > 0 ? (
        courses.slice(0, 3).map((item) => renderCourseItem({ item }))
      ) : (
        <Text style={styles.noCourses}>No courses enrolled yet</Text>
      )}
    </ScrollView>
  );

  const renderCoursesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Courses</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={projectColors.orange} style={styles.loader} />
      ) : courses.length > 0 ? (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.coursesList}
        />
      ) : (
        <Text style={styles.noCourses}>No courses enrolled yet</Text>
      )}
    </View>
  );

  const renderQrGeneratorTab = () => (
    <KeyboardAvoidingView
      style={[styles.tabContent, { flex: 1, justifyContent: 'flex-start' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Generate QR Code</Text>
      </View>
      <Text style={styles.infoText}>
        Enter text below to generate a QR code. You can use your student ID or any data.
      </Text>

      <TextInput
        style={styles.qrInput}
        placeholder="Enter text for QR code"
        value={qrInput}
        onChangeText={setQrInput}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />

      {qrInput.trim() !== '' && (
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={qrInput}
            size={250}
            backgroundColor={projectColors.white}
            color={projectColors.navy}
          />
        </View>
      )}

      {qrInput.trim() !== '' && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setQrInput('')}
          disabled={isLoading}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Hi,</Text>
          <Text style={styles.studentName}>{studentData.fullName || 'Student'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={projectColors.white} size="small" />
          ) : (
            <Ionicons name="log-out-outline" size={24} color={projectColors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'courses' && renderCoursesTab()}
        {activeTab === 'generateqr' && renderQrGeneratorTab()}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'dashboard' ? projectColors.orange : projectColors.white}
          />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.activeTabLabel]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
          onPress={() => setActiveTab('courses')}
        >
          <Ionicons
            name={activeTab === 'courses' ? 'book' : 'book-outline'}
            size={24}
            color={activeTab === 'courses' ? projectColors.orange : projectColors.white}
          />
          <Text style={[styles.tabLabel, activeTab === 'courses' && styles.activeTabLabel]}>
            Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'generateqr' && styles.activeTab]}
          onPress={() => setActiveTab('generateqr')}
        >
          <Ionicons
            name={activeTab === 'generateqr' ? 'qr-code' : 'qr-code-outline'}
            size={24}
            color={activeTab === 'generateqr' ? projectColors.orange : projectColors.white}
          />
          <Text style={[styles.tabLabel, activeTab === 'generateqr' && styles.activeTabLabel]}>
            Generate QR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: projectColors.lightGray,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: projectColors.navy,
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.medium,
  },
  headerContent: {
    flexDirection: 'column',
  },
  welcomeText: {
    fontSize: typography.sm,
    fontWeight: '300',
    color: projectColors.white,
  },
  studentName: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: projectColors.orange,
  },
  logoutButton: {
    padding: spacing.sm,
    backgroundColor: projectColors.orange,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: projectColors.navy,
    paddingVertical: spacing.sm,
    justifyContent: 'space-around',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    ...shadows.medium,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: projectColors.orange,
  },
  tabLabel: {
    color: projectColors.white,
    fontSize: typography.sm,
    marginTop: 2,
  },
  activeTabLabel: {
    color: projectColors.orange,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: projectColors.navy,
  },
  statsContainer: {
    marginVertical: spacing.md,
  },
  statsCard: {
    backgroundColor: projectColors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.small,
  },
  statsTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: projectColors.navy,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: projectColors.orange,
  },
  statLabel: {
    fontSize: typography.sm,
    color: projectColors.mediumGray,
  },
  courseItem: {
    backgroundColor: projectColors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseCode: {
    fontWeight: '700',
    fontSize: typography.md,
    color: projectColors.navy,
  },
  viewButton: {
    backgroundColor: projectColors.orange,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  viewButtonText: {
    color: projectColors.white,
    fontWeight: '600',
  },
  courseName: {
    marginTop: spacing.sm,
    fontWeight: '600',
    fontSize: typography.sm,
    color: projectColors.darkGray,
  },
  instructorName: {
    fontSize: typography.xs,
    marginTop: spacing.xs,
    color: projectColors.mediumGray,
  },
  noCourses: {
    fontSize: typography.sm,
    fontWeight: '400',
    color: projectColors.mediumGray,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  loader: {
    marginTop: spacing.lg,
  },
  coursesList: {
    paddingBottom: spacing.md,
  },
  infoText: {
    fontSize: typography.sm,
    color: projectColors.mediumGray,
    marginBottom: spacing.md,
  },
  qrInput: {
    borderWidth: 1,
    borderColor: projectColors.navy,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.md,
    color: projectColors.darkGray,
    marginBottom: spacing.md,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  clearButton: {
    marginTop: spacing.md,
    backgroundColor: projectColors.orange,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  clearButtonText: {
    color: projectColors.white,
    fontWeight: '600',
    fontSize: typography.md,
  },
});

export default StudentDashboard;
