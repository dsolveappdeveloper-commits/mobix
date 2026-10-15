import HomeOutlined from '@mui/icons-material/HomeOutlined';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import MonetizationOnOutlined from '@mui/icons-material/MonetizationOnOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';

// module = role_permissions la irukkura module name (API /me permissions key)
export const menuItems = [
  { labelKey: 'menu.dashboard', path: '/',          icon: HomeOutlined,           module: 'dashboard' },
  { labelKey: 'menu.jobs',      path: '/jobs',      icon: BuildOutlined,          module: 'jobs' },
  { labelKey: 'menu.customers', path: '/customers', icon: PeopleOutlined,         module: 'customers' },
  { labelKey: 'menu.sales',     path: '/sales',     icon: ShoppingCartOutlined,   module: 'sales' },
  { labelKey: 'menu.inventory', path: '/inventory', icon: Inventory2Outlined,     module: 'inventory' },
  { labelKey: 'menu.purchases', path: '/purchases', icon: LocalShippingOutlined,  module: 'inventory' },
  { labelKey: 'menu.billing',   path: '/billing',   icon: ReceiptLongOutlined,    module: 'billing' },
  { labelKey: 'menu.expenses',  path: '/expenses',  icon: MonetizationOnOutlined, module: 'expenses' },
  { labelKey: 'menu.reports',   path: '/reports',   icon: BarChartOutlined,       module: 'reports' },
  { labelKey: 'menu.settings',  path: '/settings',  icon: SettingsOutlined,       module: 'settings' },
];