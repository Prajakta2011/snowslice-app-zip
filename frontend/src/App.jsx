import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { 
  AppShell, 
  Container, 
  Title, 
  Text, 
  TextInput, 
  PasswordInput,
  Slider, 
  Button, 
  Card, 
  Grid, 
  Group, 
  Stack, 
  Table, 
  Badge, 
  Stepper, 
  Loader, 
  ActionIcon,
  ThemeIcon,
  Paper,
  rem,
  Divider,
  ScrollArea,
  Box,
  Code,
  Center
} from '@mantine/core';
import { 
  Database, 
  Play, 
  History as HistoryIcon, 
  Check, 
  AlertCircle, 
  Clock, 
  BarChart3, 
  Table as TableIcon, 
  RefreshCw, 
  Settings, 
  Activity,
  HardDrive,
  ClipboardList,
  AlertTriangle,
  XCircle,
  Lock,
  User,
  LogOut,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import AdminConsole from './AdminConsole';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Connection to server failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Center pt={100}>
        <Stack gap="xl" w={400}>
          <Center flex-direction="column">
            <ThemeIcon variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} size={60} radius="xl" mb="md">
              <Database size={32} />
            </ThemeIcon>
            <Title order={1} fw={900} tracking="tighter">SnowSlice Engine</Title>
            <Text c="dimmed" fw={700} size="xs">SECURE ACCESS GATEWAY</Text>
          </Center>

          <Paper shadow="xl" p={40} radius="lg" withBorder>
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput 
                  label="Username" 
                  placeholder="Enter username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  leftSection={<User size={16} />}
                  required
                />
                <PasswordInput 
                  label="Password" 
                  placeholder="Enter password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftSection={<Lock size={16} />}
                  required
                />
                {error && <Text color="red" size="xs" fw={700}>{error}</Text>}
                <Button type="submit" fullWidth mt="md" size="md" loading={loading} gradient={{ from: 'blue', to: 'cyan' }} variant="gradient">
                  Login to Console
                </Button>
                <Center mt="md">
                  <Button 
                    variant="subtle" 
                    color="gray" 
                    size="compact-xs"
                    onClick={() => navigate('/admin-login')}
                    style={{ textDecoration: 'underline', fontWeight: 400 }}
                  >
                    Admin Console
                  </Button>
                </Center>
              </Stack>
            </form>
          </Paper>
          <Text c="dimmed" size="xs" ta="center">Default access: abc123 / abc123</Text>
        </Stack>
      </Center>
    </Box>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sourceDb: 'PROD_DB',
    sourceSchema: 'SALES',
    targetDb: 'DEV_DB',
    targetSchema: 'SALES_SLICE',
    samplePercent: 20
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [targetStats, setTargetStats] = useState([]);
  const [fetchingStats, setFetchingStats] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/history');
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("History fetch failed", err);
    }
  };

  const fetchTargetStats = async (overridePercent) => {
    if (!formData.targetDb || !formData.targetSchema) return;
    const percentToUse = overridePercent !== undefined ? overridePercent : formData.samplePercent;
    setFetchingStats(true);
    try {
      const res = await fetch(`http://localhost:3000/api/target-stats?db=${formData.targetDb}&schema=${formData.targetSchema}&percent=${percentToUse}`);
      const data = await res.json();
      setTargetStats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Target stats fetch failed", err);
    } finally {
      setFetchingStats(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchTargetStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setActiveStep(1); 

    try {
      const res = await fetch('http://localhost:3000/api/slice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResponse(data);
      
      const newHistoryEntry = {
        RUN_ID: data.execution_id || `RUN-${Date.now()}`,
        EXECUTION_TIME: new Date().toISOString(),
        SOURCE: `${formData.sourceDb}.${formData.sourceSchema}`,
        TARGET: `${formData.targetDb}.${formData.targetSchema}`,
        STATUS: (data.status?.toLowerCase() === 'success' || data.ROW_COUNTS) ? 'SUCCESS' : 'ERROR'
      };
      setHistory(prev => [newHistoryEntry, ...prev]);

      if (data && (data.status?.toLowerCase() === 'success' || data.ROW_COUNTS)) {
        setActiveStep(3); 
        await fetchTargetStats(formData.samplePercent);
      } else {
        setActiveStep(0);
      }
      fetchHistory();
    } catch (err) {
      setResponse({ status: 'error', error: err.message });
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toUpperCase();
    if (s === 'SUCCESS') return 'green';
    if (s === 'SKIPPED') return 'yellow';
    if (s === 'ERROR') return 'red';
    return 'gray';
  };

  const getRowBg = (status) => {
    const s = status?.toUpperCase();
    if (s === 'SKIPPED') return '#fff9db';
    if (s === 'ERROR') return '#fff5f5';
    return undefined;
  };

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
      styles={{ main: { backgroundColor: '#f8f9fa' } }}
    >
      <AppShell.Header p="md">
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group>
              <ThemeIcon variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} size="xl" radius="md">
                <Database size={24} />
              </ThemeIcon>
              <Stack gap={0}>
                <Title order={3}>SnowSlice Engine</Title>
                <Text size="xs" c="dimmed" fw={700}>ENTERPRISE DATA VIRTUALIZATION</Text>
              </Stack>
            </Group>
            <Group gap="lg">
              <Badge color="green" variant="light" size="lg" leftSection={<Activity size={14} />}>
                CONNECTED
              </Badge>
              <ActionIcon variant="light" color="red" size="lg" onClick={() => {
                localStorage.removeItem('user');
                navigate('/');
              }} title="Logout">
                <LogOut size={18} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Grid gutter="xl">
            {/* Sidebar */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack gap="lg">
                <Card shadow="sm" radius="md" withBorder p="xl">
                  <Group mb="md">
                    <Settings size={20} color="#228be6" />
                    <Text fw={700} size="sm" uppercase tracking="wider">Configurator</Text>
                  </Group>
                  <form onSubmit={handleSubmit}>
                    <Stack gap="md">
                      <TextInput label="Source Database" value={formData.sourceDb} onChange={(e) => setFormData({...formData, sourceDb: e.target.value})} />
                      <TextInput label="Source Schema" value={formData.sourceSchema} onChange={(e) => setFormData({...formData, sourceSchema: e.target.value})} />
                      <TextInput label="Target Database" value={formData.targetDb} onChange={(e) => setFormData({...formData, targetDb: e.target.value})} />
                      <TextInput label="Target Schema" value={formData.targetSchema} onChange={(e) => setFormData({...formData, targetSchema: e.target.value})} />
                      <Box mt="md">
                        <Group justify="space-between" mb={5}>
                          <Text size="sm" fw={500}>Sampling Ratio</Text>
                          <Badge variant="filled">{formData.samplePercent}%</Badge>
                        </Group>
                        <Slider value={formData.samplePercent} onChange={(val) => setFormData({...formData, samplePercent: val})} />
                      </Box>
                      <Button type="submit" fullWidth size="md" mt="xl" loading={loading} leftSection={<Play size={18} />} gradient={{ from: 'blue', to: 'cyan' }} variant="gradient">
                        Initiate Procedure
                      </Button>
                    </Stack>
                  </form>
                </Card>

                <Card shadow="sm" radius="md" withBorder p="xl">
                  <Group justify="space-between" mb="md">
                    <Group gap="xs">
                      <HardDrive size={20} color="#10B981" />
                      <Text fw={700} size="sm" uppercase tracking="wider">Target Stats</Text>
                    </Group>
                    <ActionIcon variant="subtle" color="green" loading={fetchingStats} onClick={() => fetchTargetStats()}>
                      <RefreshCw size={16} />
                    </ActionIcon>
                  </Group>
                  <ScrollArea.Autosize maxHeight={250}>
                    <Stack gap="xs">
                      {Array.isArray(targetStats) && targetStats.map((stat, i) => (
                        <Paper key={i} withBorder p="xs" radius="sm" bg="green.0" style={{ borderColor: rem('#b2f2bb') }}>
                          <Group justify="space-between">
                            <Text size="xs" fw={900}>{stat.TABLE_NAME}</Text>
                            <Badge variant="white" color="green" size="sm">{Number(stat.ROW_COUNT || 0).toLocaleString()} rows</Badge>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea.Autosize>
                </Card>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Stack gap="xl">
                <Card shadow="sm" padding="xl" radius="md" withBorder>
                  <Stepper active={activeStep} breakpoint="sm" allowNextStepsSelect={false}>
                    <Stepper.Step label="Configuration" description={activeStep === 0 ? "Ready" : "Done"} icon={<Database size={18} />} />
                    <Stepper.Step label="Extraction" description={activeStep === 1 ? "Running" : "Done"} icon={activeStep === 1 ? <Loader size={18} className="animate-spin" /> : <TableIcon size={18} />} />
                    <Stepper.Step label="Validation" description={activeStep === 2 ? "Checking" : "Done"} icon={activeStep === 2 ? <Loader size={18} className="animate-spin" /> : <Check size={18} />} />
                    <Stepper.Completed>
                      <Text fw={700} c="green" size="sm" mt="sm">Procedure completed successfully</Text>
                    </Stepper.Completed>
                  </Stepper>
                </Card>

                {loading ? (
                  <Stack align="center" py={100}>
                    <Loader size="xl" variant="bars" color="blue" />
                    <Text fw={700} c="blue">EXECUTING CLOUD PROCEDURE...</Text>
                  </Stack>
                ) : response && (
                  <Stack gap="lg">
                    {(() => {
                      const tables = Array.isArray(response.tables_processed) ? response.tables_processed : [];
                      const targetTotal = Array.isArray(targetStats) ? targetStats.reduce((sum, s) => sum + Number(s.ROW_COUNT || 0), 0) : 0;
                      const scannedCount = response.ROWS_SCANNED || response.rows_scanned || targetTotal;
                      const success = response.status?.toLowerCase() === 'success';

                      return (
                        <Grid gutter="md">
                          <Grid.Col span={4}>
                            <Paper withBorder p="md" radius="md" bg="blue.0" style={{ borderColor: rem('#d0ebff') }}>
                              <Group><Clock size={20} color="#228be6" /><Text size="xs" fw={700} c="blue.7">TOTAL TIME</Text></Group>
                              <Title order={2} mt="xs" c="blue.9">{Number(response.DURATION_SECONDS || 0)}s</Title>
                            </Paper>
                          </Grid.Col>
                          <Grid.Col span={4}>
                            <Paper withBorder p="md" radius="md" bg="gray.0">
                              <Group><BarChart3 size={20} color="gray" /><Text size="xs" fw={700} c="dimmed">ROWS SCANNED</Text></Group>
                              <Title order={2} mt="xs">{Number(scannedCount).toLocaleString()}</Title>
                            </Paper>
                          </Grid.Col>
                          <Grid.Col span={4}>
                            <Paper withBorder p="md" radius="md" bg={success ? 'green.0' : 'red.0'} style={{ borderColor: success ? '#b2f2bb' : '#ffa8a8' }}>
                              <Group>
                                {success ? <Check size={20} color="#40c057" /> : <XCircle size={20} color="#fa5252" />}
                                <Text size="xs" fw={700} c={success ? 'green.8' : 'red.8'}>INTEGRITY</Text>
                              </Group>
                              <Title order={3} mt="xs" c={success ? 'green.9' : 'red.9'}>
                                {response.INTEGRITY_CHECK || (success ? 'PASSED' : 'FAILED')}
                              </Title>
                            </Paper>
                          </Grid.Col>
                        </Grid>
                      );
                    })()}

                    {Array.isArray(response.tables_processed) && (
                      <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group mb="lg">
                          <ClipboardList size={20} color="#228be6" />
                          <Text fw={700} uppercase tracking="wider">Execution Report</Text>
                        </Group>
                        <Table verticalSpacing="sm" withColumnBorders withTableBorder>
                          <Table.Thead bg="gray.0">
                            <Table.Tr>
                              <Table.Th>Table</Table.Th>
                              <Table.Th>Status</Table.Th>
                              <Table.Th>Count</Table.Th>
                              <Table.Th>Notes</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {response.tables_processed.map((table, i) => (
                              <Table.Tr key={i} style={{ backgroundColor: getRowBg(table.status) }}>
                                <Table.Td><Text size="sm" fw={700} fontFamily="monospace">{table.name}</Text></Table.Td>
                                <Table.Td><Badge color={getStatusColor(table.status)} variant="filled" size="sm">{table.status}</Badge></Table.Td>
                                <Table.Td><Text size="sm" fw={700}>{Number(table.count || 0).toLocaleString()}</Text></Table.Td>
                                <Table.Td>
                                  <Group gap="xs">
                                    {table.status === 'ERROR' && <AlertTriangle size={14} color="red" />}
                                    <Text size="xs" italic>{table.notes || '---'}</Text>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Card>
                    )}
                  </Stack>
                )}

                <Card shadow="sm" radius="md" withBorder p="xl">
                  <Group justify="space-between" mb="xl">
                    <Group><HistoryIcon size={24} color="#228be6" /><Title order={3}>Execution History</Title></Group>
                    <Button variant="subtle" size="xs" onClick={fetchHistory}>Refresh Log</Button>
                  </Group>
                  <Table verticalSpacing="sm" highlightOnHover>
                    <Table.Thead bg="gray.0">
                      <Table.Tr>
                        <Table.Th>Time</Table.Th>
                        <Table.Th>Path</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {Array.isArray(history) && history.slice(0, 5).map((h, i) => {
                        const execTime = h.EXECUTION_TIME || h.execution_time;
                        return (
                          <Table.Tr key={i}>
                            <Table.Td>
                              <Text size="xs">
                                {execTime ? new Date(execTime).toLocaleString() : new Date().toLocaleString()}
                              </Text>
                            </Table.Td>
                            <Table.Td><Text size="xs" fw={700}>{h.SOURCE?.slice(0, 15) || 'PROD'} ➔ {h.TARGET?.slice(0, 15) || 'DEV'}</Text></Table.Td>
                            <Table.Td><Badge size="xs" color={h.STATUS?.toUpperCase() === 'SUCCESS' ? 'green' : 'red'}>{h.STATUS}</Badge></Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Card>

                {!loading && !response && (
                  <Paper withBorder p={60} radius="md" style={{ borderStyle: 'dashed', textAlign: 'center', opacity: 0.5 }}>
                    <Database size={40} strokeWidth={1} style={{ marginBottom: 15 }} />
                    <Title order={4} c="dimmed">Standby Mode</Title>
                    <Text size="sm" c="dimmed">Initiate procedure to begin slicing.</Text>
                  </Paper>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        navigate('/admin');
      } else {
        setError('Invalid Admin credentials');
      }
    } catch (err) {
      setError('Connection to server failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="gray.9" style={{ minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Center pt={100}>
        <Stack gap="xl" w={400}>
          <Center flex-direction="column">
            <ThemeIcon variant="filled" color="indigo" size={60} radius="xl" mb="md">
              <ShieldCheck size={32} />
            </ThemeIcon>
            <Title order={1} fw={900} c="white" tracking="tighter">Admin Console</Title>
            <Text c="gray.5" fw={700} size="xs">RESTRICTED ACCESS AREA</Text>
          </Center>

          <Paper shadow="xl" p={40} radius="lg" withBorder>
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput 
                  label="Admin Email" 
                  placeholder="admin@snowslice.io" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  leftSection={<User size={16} />}
                  required
                />
                <PasswordInput 
                  label="Security Key" 
                  placeholder="Enter admin password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftSection={<Lock size={16} />}
                  required
                />
                {error && <Text color="red" size="xs" fw={700}>{error}</Text>}
                <Button type="submit" fullWidth mt="md" size="md" loading={loading} color="indigo">
                  Authorize Access
                </Button>
                <Center mt="md">
                  <Button 
                    variant="subtle" 
                    color="gray" 
                    size="compact-xs"
                    onClick={() => navigate('/')}
                    leftSection={<ArrowLeft size={14} />}
                  >
                    Back to Standard Login
                  </Button>
                </Center>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Center>
    </Box>
  );
}

function ProtectedAdminRoute({ children }) {
  const navigate = useNavigate();
  const admin = localStorage.getItem('adminUser');
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    if (!admin) {
      navigate('/admin-login');
    } else {
      setIsChecking(false);
    }
  }, [admin, navigate]);

  if (isChecking) return null;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminConsole onBack={() => window.location.href = '/dashboard'} />
            </ProtectedAdminRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
