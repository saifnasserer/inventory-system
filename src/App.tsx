import { Refine, Authenticated } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  ErrorComponent,
  ThemedLayoutV2,
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
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { App as AntdApp, ConfigProvider } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import arEG from "antd/locale/ar_EG";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { authProvider } from "./authProvider";
import { supabaseClient } from "./utility/supabaseClient";
import { accessControlProvider } from "./accessControlProvider";
import { customDataProvider } from "./utility/customDataProvider";
import { ImpersonationProvider } from "./contexts/impersonation";

// Import pages
import { DashboardPage } from "./pages/dashboard";
import { ShipmentList, ShipmentCreate } from "./pages/receiving";
import { DeviceList, DeviceShow, DeviceEdit } from "./pages/warehouse";
import { MaintenanceList } from "./pages/maintenance";
import { Login } from "./pages/auth";
import { CompanyList, CompanyCreate, CompanyEdit, CompanyShow } from "./pages/companies";
import { EmployeeDashboard } from "./pages/employee-dashboard";
import { MyTasksPage } from "./pages/my-tasks";
import { SalesPage } from "./pages/sales";
import { SalesPortalPage } from "./pages/sales-portal";
import { MaintenanceDashboard } from "./pages/maintenance-dashboard";
import { Header } from "./components/header";
import { AdminRoute } from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <ConfigProvider
            direction="rtl"
            locale={arEG}
            theme={{
              token: {
                colorPrimary: "#1890ff",
                fontFamily: "'Cairo', sans-serif",
                borderRadius: 12,
                borderRadiusLG: 16,
                borderRadiusSM: 8,
              },
            }}
          >

            <ImpersonationProvider>
              <AntdApp>
                <DevtoolsProvider>
                  <Refine
                    authProvider={authProvider}
                    dataProvider={customDataProvider}
                    accessControlProvider={accessControlProvider}
                    liveProvider={liveProvider(supabaseClient)}
                    notificationProvider={useNotificationProvider}
                    routerProvider={routerProvider}
                    resources={[
                      {
                        name: "dashboard",
                        list: "/",
                        meta: {
                          label: "لوحة التحكم",
                          icon: "📊",
                          roles: ["admin", "warehouse_manager", "branch_manager"],
                        },
                      },
                      {
                        name: "shipments",
                        list: "/receiving/shipments",
                        create: "/receiving/shipments/create",
                        meta: {
                          label: "الشحنات",
                          icon: "📦",
                          roles: ["admin", "warehouse_manager"],
                        },
                      },
                      {
                        name: "devices",
                        list: "/warehouse/devices",
                        show: "/warehouse/devices/show/:id",
                        edit: "/warehouse/devices/edit/:id",
                        meta: {
                          label: "المخزن",
                          icon: "💻",
                          roles: ["admin", "warehouse_manager", "branch_manager"],
                        },
                      },
                      {
                        name: "maintenance-dashboard",
                        list: "/maintenance/dashboard",
                        meta: {
                          label: "لوحة الصيانة",
                          icon: "🔧",
                          roles: ["repair_manager"],
                        },
                      },
                      {
                        name: "maintenance",
                        list: "/maintenance/devices",
                        show: "/maintenance/devices/show/:id",
                        meta: {
                          label: "بوابة الصيانة",
                          icon: "🛠️",
                          roles: ["repair_manager"],
                        },
                      },
                      {
                        name: "sales",
                        list: "/sales",
                        meta: {
                          label: "المبيعات",
                          icon: "💰",
                          roles: ["admin", "warehouse_manager", "branch_manager"],
                        },
                      },
                      {
                        name: "sales-portal",
                        list: "/sales-portal",
                        meta: {
                          label: "بوابة المبيعات",
                          icon: "🛒",
                          roles: ["branch_manager", "sales_staff"],
                        },
                      },
                      {
                        name: "my-dashboard",
                        list: "/my-dashboard",
                        meta: {
                          label: "لوحتي",
                          icon: "👤",
                          roles: ["warehouse_staff", "technician", "sales_staff"],
                        },
                      },
                      {
                        name: "my-tasks",
                        list: "/my-tasks",
                        meta: {
                          label: "مهامي",
                          icon: "📋",
                          roles: ["warehouse_staff", "technician"],
                        },
                      },
                      {
                        name: "repairs",
                        meta: {
                          hide: true, // Hidden from menu, used for data operations only
                        },
                      },
                      {
                        name: "spare_parts_requests",
                        meta: {
                          hide: true, // Hidden from menu, used for data operations only
                        },
                      },
                      {
                        name: "device_assignments",
                        meta: {
                          hide: true, // Hidden from menu, used for data operations only
                        },
                      },
                      {
                        name: "users",
                        meta: {
                          hide: true, // Hidden from menu, used for data operations only
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
                          icon: "🏢",
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
                            <ThemedLayoutV2 Header={Header} Sider={() => null}>
                              <Outlet />
                            </ThemedLayoutV2>
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
                          <Route index element={<SalesPortalPage />} />
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
                  <DevtoolsPanel />
                </DevtoolsProvider>
              </AntdApp>
            </ImpersonationProvider>
          </ConfigProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter >
  );
}

export default App;
