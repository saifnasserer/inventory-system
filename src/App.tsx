import { Refine, Authenticated } from "@refinedev/core";
import {
  ToolOutlined,
  SwapOutlined,
  PieChartOutlined,
  ContainerOutlined,
  LaptopOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  ProfileOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  BuildOutlined,
  BarsOutlined,
  FileTextOutlined
} from "@ant-design/icons";
// Devtools removed to clear console error
// import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  ErrorComponent,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import "./styles/global.css";
import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
  CatchAllNavigate,
} from "@refinedev/react-router-v6";
import { App as AntdApp, ConfigProvider } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import arEG from "antd/locale/ar_EG";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { authProvider } from "./authProvider";
import { accessControlProvider } from "./accessControlProvider";
import { customDataProvider } from "./utility/customDataProvider";
import { ImpersonationProvider } from "./contexts/impersonation";

// Import pages
import { DashboardPage } from "./pages/dashboard";
import { ShipmentList, ShipmentCreate, ReviewReport } from "./pages/receiving";
import { DeviceList, DeviceShow, DeviceEdit } from "./pages/warehouse";
import { MaintenanceList } from "./pages/maintenance";
import { Login } from "./pages/auth";
import { CompanyList, CompanyCreate, CompanyEdit, CompanyShow } from "./pages/companies";
import { EmployeeDashboard } from "./pages/employee-dashboard";
import { MyTasksPage } from "./pages/my-tasks";
import { SalesPage } from "./pages/sales";
import { SalesPortalList } from "./pages/sales-portal";
import { InvoiceCreate } from "./pages/invoices";
import { MaintenanceDashboard } from "./pages/maintenance-dashboard";
import { CustomLayout } from "./components/layout";
import { AdminRoute } from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <ConfigProvider
            direction="rtl"
            locale={arEG}
            theme={{
              token: {
                colorPrimary: "#1890ff",
                colorBgLayout: "#ffffff",
                colorBgContainer: "#ffffff",
                fontFamily: "'Cairo', sans-serif",
                borderRadius: 16, // Increased for circular/rounded feel
                borderRadiusLG: 24,
                borderRadiusSM: 12,
                boxShadowSecondary: "none", // Remove shadows
              },
              components: {
                Layout: {
                  bodyBg: "#ffffff",
                  headerBg: "#ffffff",
                  triggerBg: "#ffffff",
                },
                Menu: {
                  colorBgContainer: "#ffffff",
                  itemBg: "#ffffff",
                  subMenuItemBg: "#ffffff",
                },
                Card: {
                  boxShadowTertiary: "none", // Remove card shadows
                }
              }
            }}
          >

            <ImpersonationProvider>
              <AntdApp>
                {/* DevtoolsProvider removed */}
                <Refine
                  authProvider={authProvider}
                  dataProvider={customDataProvider}
                  accessControlProvider={accessControlProvider}
                  notificationProvider={useNotificationProvider}
                  routerProvider={routerProvider}
                  resources={[
                    {
                      name: "dashboard",
                      list: "/",
                      meta: {
                        label: "لوحة التحكم الرئيسية",
                        icon: <PieChartOutlined />,
                        roles: ["admin", "warehouse_manager"],
                      },
                    },
                    {
                      name: "shipments",
                      list: "/receiving/shipments",
                      create: "/receiving/shipments/create",
                      meta: {
                        label: "الشحنات",
                        icon: <ContainerOutlined />,
                        roles: ["admin", "warehouse_manager"],
                      },
                    },
                    {
                      name: "devices",
                      list: "/warehouse/devices",
                      show: "/warehouse/devices/show/:id",
                      edit: "/warehouse/devices/edit/:id",
                      meta: {
                        label: "بوابة المخزن",
                        icon: <LaptopOutlined />,
                        roles: ["admin", "warehouse_manager", "branch_manager"],
                      },
                    },
                    {
                      name: "maintenance-dashboard",
                      list: "/maintenance/dashboard",
                      meta: {
                        label: "لوحة الصيانة",
                        icon: <SettingOutlined />,
                        roles: ["repair_manager"],
                      },
                    },
                    {
                      name: "maintenance",
                      list: "/maintenance/devices",
                      show: "/maintenance/devices/show/:id",
                      meta: {
                        label: "بوابة الصيانة",
                        icon: <ToolOutlined />,
                        roles: ["admin", "warehouse_manager", "repair_manager"],
                      },
                    },
                    {
                      name: "sales",
                      list: "/sales",
                      meta: {
                        label: "لوحة المبيعات",
                        icon: <ShoppingCartOutlined />,
                        roles: ["branch_manager"],
                      },
                    },
                    {
                      name: "sales-portal",
                      list: "/sales-portal",
                      meta: {
                        label: "بوابة المبيعات",
                        icon: <ShopOutlined />,
                        roles: ["admin", "warehouse_manager", "branch_manager", "sales_staff"],
                      },
                    },
                    {
                      name: "my-dashboard",
                      list: "/my-dashboard",
                      meta: {
                        label: "لوحتي",
                        icon: <UserOutlined />,
                        roles: ["warehouse_staff", "technician", "sales_staff"],
                      },
                    },
                    {
                      name: "my-tasks",
                      list: "/my-tasks",
                      meta: {
                        label: "مهامي",
                        icon: <FileTextOutlined />,
                        roles: ["warehouse_staff", "technician"],
                      },
                    },
                    {
                      name: "technical-inspections",
                      meta: {
                        hide: true,
                      },
                    },
                    {
                      name: "physical-inspections",
                      meta: {
                        hide: true,
                      },
                    },
                    {
                      name: "repairs",
                      meta: {
                        hide: true,
                      },
                    },
                    {
                      name: "spare-parts-requests",
                      meta: {
                        hide: true,
                      },
                    },
                    {
                      name: "device-assignments",
                      meta: {
                        hide: true,
                      },
                    },
                    {
                      name: "users",
                      meta: {
                        hide: true,
                      },
                    },
                    {
                      name: "companies",
                      list: "/companies",
                      create: "/companies/create",
                      edit: "/companies/edit/:id",
                      show: "/companies/show/:id",
                      meta: {
                        label: "الشركات",
                        icon: <BuildOutlined />,
                        roles: ["super_admin"],
                      },
                    },
                  ]}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
                    liveMode: "auto",
                  }}
                >
                  <Routes>
                    <Route
                      element={
                        <Authenticated
                          key="authenticated-routes"
                          fallback={<CatchAllNavigate to="/login" />}
                        >
                          <CustomLayout>
                            <Outlet />
                          </CustomLayout>
                        </Authenticated>
                      }
                    >
                      <Route index element={<DashboardPage />} />

                      {/* Receiving Routes */}
                      <Route path="/receiving">
                        <Route path="shipments">
                          <Route index element={<ShipmentList />} />
                          <Route path="create" element={<ShipmentCreate />} />
                          <Route path="inspect/:id" element={<DeviceShow />} />
                          <Route path="review/:id" element={<ReviewReport />} />
                        </Route>
                      </Route>

                      {/* Warehouse Routes */}
                      <Route path="/warehouse">
                        <Route path="devices">
                          <Route index element={<DeviceList />} />
                          <Route path="show/:id" element={<DeviceShow />} />
                          <Route path="edit/:id" element={<DeviceEdit />} />
                        </Route>
                      </Route>

                      {/* Maintenance Routes */}
                      <Route path="/maintenance">
                        <Route path="dashboard">
                          <Route index element={<MaintenanceDashboard />} />
                        </Route>
                        <Route path="devices">
                          <Route index element={<MaintenanceList />} />
                          <Route path="show/:id" element={<DeviceShow />} />
                        </Route>
                      </Route>

                      {/* Employee Routes */}
                      <Route path="/my-dashboard">
                        <Route index element={<EmployeeDashboard />} />
                      </Route>

                      <Route path="/my-tasks">
                        <Route index element={<MyTasksPage />} />
                      </Route>

                      {/* Sales Routes */}
                      <Route path="/sales">
                        <Route index element={<SalesPage />} />
                      </Route>

                      <Route path="/sales-portal">
                        <Route index element={<SalesPortalList />} />
                      </Route>

                      <Route path="/invoices">
                        <Route path="create" element={<InvoiceCreate />} />
                      </Route>

                    </Route>


                    {/* Companies Routes (Admin - Separate Layout) */}
                    <Route element={<AdminRoute />}>
                      <Route path="/companies">
                        <Route index element={<CompanyList />} />
                        <Route path="create" element={<CompanyCreate />} />
                        <Route path="edit/:id" element={<CompanyEdit />} />
                        <Route path="show/:id" element={<CompanyShow />} />
                      </Route>
                    </Route>

                    <Route path="*" element={<ErrorComponent />} />


                    <Route
                      element={
                        <Authenticated key="auth-pages" fallback={<Outlet />}>
                          <NavigateToResource resource="dashboard" />
                        </Authenticated>
                      }
                    >
                      <Route
                        path="/login"
                        element={<Login />}
                      />
                    </Route>
                  </Routes>

                  <RefineKbar />
                  <UnsavedChangesNotifier />
                  <DocumentTitleHandler />
                </Refine>
                {/* DevtoolsPanel removed */}
                {/* </DevtoolsProvider> */}
              </AntdApp>
            </ImpersonationProvider>
          </ConfigProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter >
  );
}

export default App;
