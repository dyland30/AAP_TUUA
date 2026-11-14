import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { openSessionGuard } from './guards/open-session.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: 'open_cashier_session',
        loadComponent: () =>
          import('./open-cashier-session/open-cashier-session').then((m) => m.OpenCashierSession),
      },
      {
        path: 'cash_movements',
        canActivate: [openSessionGuard],
        loadComponent: () =>
          import('./cash-movements/cash-movements').then((m) => m.CashMovements),
      },
      {
        path: 'close_cashier_session',
        loadComponent: () =>
          import('./close-cashier-session/close-cashier-session').then((m) => m.CloseCashierSession),
      },
      {
        path: 'cashier_session_report',
        loadComponent: () =>
          import('./cashier-session-report/cashier-session-report').then((m) => m.CashierSessionReport),
      },
      {
        path: 'tuua_ticket_sale',
        canActivate: [openSessionGuard],
        loadComponent: () =>
          import('./tuua-ticket-sale/tuua-ticket-sale').then((m) => m.TuuaTicketSale),
      },
      {
        path: 'tuua_sales_search',
        loadComponent: () =>
          import('./tuua-sales-search/tuua-sales-search').then((m) => m.TuuaSalesSearch),
      },
      {
        path: 'boardingpass_search',
        loadComponent: () =>
          import('./boardingpass-search/boardingpass-search').then((m) => m.BoardingpassSearch),
      },
      {
        path: 'money_exchange',
        canActivate: [openSessionGuard],
        loadComponent: () =>
          import('./money-exchange/money-exchange').then((m) => m.MoneyExchange),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users').then((m) => m.Users),
      },
      {
        path: 'companies',
        loadComponent: () => import('./companies/companies').then((m) => m.Companies),
      },
      {
        path: 'users/:userId/cashier_machines',
        loadComponent: () =>
          import('./assign-cashier-machines/assign-cashier-machines').then(
            (m) => m.AssignCashierMachines,
          ),
      },
      {
        path: 'users/:userId/gate_unlock_keys',
        loadComponent: () =>
          import('./assign-gate-unlock-keys/assign-gate-unlock-keys').then(
            (m) => m.AssignGateUnlockKeys,
          ),
      },
      {
        path: 'gate_unlock_key_usage_report',
        loadComponent: () =>
          import('./gate-unlock-key-usage-report/gate-unlock-key-usage-report').then(
            (m) => m.GateUnlockKeyUsageReport,
          ),
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/roles').then((m) => m.Roles),
      },
      {
        path: 'roles/:roleId/resources',
        loadComponent: () =>
          import('./assign-resources/assign-resources').then((m) => m.AssignResources),
      },
      {
        path: 'features',
        loadComponent: () => import('./features/features').then((m) => m.Features),
      },
      {
        path: 'resources',
        loadComponent: () => import('./resources/resources').then((m) => m.Resources),
      },
      {
        path: 'airlines',
        loadComponent: () => import('./airlines/airlines').then((m) => m.Airlines),
      },
      {
        path: 'aircraft_types',
        loadComponent: () => import('./aircraft-types/aircraft-types').then((m) => m.AircraftTypes),
      },
      {
        path: 'aircrafts',
        loadComponent: () => import('./aircrafts/aircrafts').then((m) => m.Aircrafts),
      },
      {
        path: 'flights',
        loadComponent: () => import('./flights/flights').then((m) => m.Flights),
      },
      {
        path: 'airport_resource_allocations',
        loadComponent: () =>
          import('./airport-resource-allocations/airport-resource-allocations').then(
            (m) => m.AirportResourceAllocations,
          ),
      },
      {
        path: 'airports',
        loadComponent: () => import('./airports/airports').then((m) => m.Airports),
      },
      {
        path: 'airports/:airportId/terminals',
        loadComponent: () => import('./terminals/terminals').then((m) => m.Terminals),
      },
      {
        path: 'airports/:airportId/terminals/:terminalId/resources',
        loadComponent: () =>
          import('./airport-resources/airport-resources').then((m) => m.AirportResources),
      },
      {
        path: 'airports/:airportId/runways',
        loadComponent: () => import('./runways/runways').then((m) => m.Runways),
      },
      {
        path: 'locations',
        loadComponent: () => import('./locations/locations').then((m) => m.Locations),
      },
      {
        path: 'tuua_gates',
        loadComponent: () => import('./tuua-gates/tuua-gates').then((m) => m.TuuaGates),
      },
      {
        path: 'tuua_prices',
        loadComponent: () => import('./tuua-prices/tuua-prices').then((m) => m.TuuaPrices),
      },
      {
        path: 'exchange_rates',
        loadComponent: () =>
          import('./exchange-rates/exchange-rates').then((m) => m.ExchangeRates),
      },
      {
        path: 'tuua_access',
        loadComponent: () => import('./tuua-access/tuua-access').then((m) => m.TuuaAccess),
      },
      {
        path: 'cashier_machines',
        loadComponent: () =>
          import('./cashier-machines/cashier-machines').then((m) => m.CashierMachines),
      },
      {
        path: 'document_serial_groups',
        loadComponent: () =>
          import('./document-serial-groups/document-serial-groups').then((m) => m.DocumentSerialGroups),
      },
      {
        path: 'document_serial_groups/:groupId/sequential-numbers',
        loadComponent: () =>
          import('./document-sequential-numbers/document-sequential-numbers').then(
            (m) => m.DocumentSequentialNumbers,
          ),
      },
      {
        path: 'ubigeos',
        loadComponent: () => import('./ubigeos/ubigeos').then((m) => m.Ubigeos),
      },
      {
        path: 'airport_sectors',
        loadComponent: () => import('./airport-sectors/airport-sectors').then((m) => m.AirportSectors),
      },
      {
        path: 'airport_sectors/:sectorId/evacuation_routes',
        loadComponent: () =>
          import('./evacuation-routes/evacuation-routes').then((m) => m.EvacuationRoutes),
      },
      {
        path: 'flight_timing_rules',
        loadComponent: () =>
          import('./flight-timing-rules/flight-timing-rules').then((m) => m.FlightTimingRules),
      },
      {
        path: 'devices',
        loadComponent: () => import('./devices/devices').then((m) => m.Devices),
      },
      {
        path: 'video_walls',
        loadComponent: () => import('./video-walls/video-walls').then((m) => m.VideoWalls),
      },
      {
        path: 'behavior_groups',
        loadComponent: () =>
          import('./behavior-groups/behavior-groups').then((m) => m.BehaviorGroups),
      },
      {
        path: 'behavior_groups/:groupId/rules',
        loadComponent: () =>
          import('./behavior-group-rules/behavior-group-rules').then((m) => m.BehaviorGroupRules),
      },
      {
        path: 'behavior_groups/:groupId/templates',
        loadComponent: () =>
          import('./behavior-group-templates/behavior-group-templates').then(
            (m) => m.BehaviorGroupTemplates,
          ),
      },
      {
        path: 'display_templates',
        loadComponent: () =>
          import('./display-templates/display-templates').then((m) => m.DisplayTemplates),
      },
      {
        path: 'display_templates/:templateId/versions',
        loadComponent: () =>
          import('./display-template-versions/display-template-versions').then(
            (m) => m.DisplayTemplateVersions,
          ),
      },
      {
        path: 'display_templates/:templateId/versions/:versionId/fields',
        loadComponent: () =>
          import('./display-template-fields/display-template-fields').then(
            (m) => m.DisplayTemplateFields,
          ),
      },
      {
        path: 'display_templates/:templateId/versions/:versionId/widgets',
        loadComponent: () =>
          import('./display-template-widgets/display-template-widgets').then(
            (m) => m.DisplayTemplateWidgets,
          ),
      },
      {
        path: 'media_assets',
        loadComponent: () => import('./media-assets/media-assets').then((m) => m.MediaAssets),
      },
      {
        path: 'ad_campaigns',
        loadComponent: () => import('./ad-campaigns/ad-campaigns').then((m) => m.AdCampaigns),
      },
      {
        path: 'ad_campaigns/:campaignId/items',
        loadComponent: () =>
          import('./ad-campaign-items/ad-campaign-items').then((m) => m.AdCampaignItems),
      },
      {
        path: 'ad_campaigns/:campaignId/behavior_groups',
        loadComponent: () =>
          import('./ad-campaign-behavior-groups/ad-campaign-behavior-groups').then(
            (m) => m.AdCampaignBehaviorGroups,
          ),
      },
      {
        path: 'virtual_keypad_buttons',
        loadComponent: () =>
          import('./virtual-keypad-buttons/virtual-keypad-buttons').then(
            (m) => m.VirtualKeypadButtons,
          ),
      },
      {
        path: 'emergency_alerts',
        loadComponent: () =>
          import('./emergency-alerts/emergency-alerts').then((m) => m.EmergencyAlerts),
      },
      {
        path: 'emergency_alert_display_rules',
        loadComponent: () =>
          import('./emergency-alert-display-rules/emergency-alert-display-rules').then(
            (m) => m.EmergencyAlertDisplayRules,
          ),
      },
      {
        path: 'emergency_message_templates',
        loadComponent: () =>
          import('./emergency-message-templates/emergency-message-templates').then(
            (m) => m.EmergencyMessageTemplates,
          ),
      },
      {
        path: 'notification_recipients',
        loadComponent: () =>
          import('./notification-recipients/notification-recipients').then(
            (m) => m.NotificationRecipients,
          ),
      },
      {
        path: 'audit_logs',
        loadComponent: () => import('./audit-logs/audit-logs').then((m) => m.AuditLogs),
      },
      {
        path: 'users/:userId/airlines',
        loadComponent: () =>
          import('./assign-airlines/assign-airlines').then((m) => m.AssignAirlines),
      },
      {
        path: 'users/:userId/airports',
        loadComponent: () =>
          import('./assign-airports/assign-airports').then((m) => m.AssignAirports),
      },
    ],
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  { path: '**', redirectTo: '' },
];
