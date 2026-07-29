import { Route, Routes } from 'react-router-dom';

import BareMetalInstanceCatalogItemCreatePage from '@osac/ui-components/pages/admin/baremetal-instance/BareMetalInstanceCatalogItemCreatePage';
import CatalogManagementListPage from '@osac/ui-components/pages/admin/CatalogManagementListPage';
import ClusterCatalogItemCreatePage from '@osac/ui-components/pages/admin/cluster/ClusterCatalogItemCreatePage';
import ComputeInstanceCatalogItemCreatePage from '@osac/ui-components/pages/admin/compute-instance/ComputeInstanceCatalogItemCreatePage';

export const AdminCatalogRoutes = () => {
  return (
    <Routes>
      <Route index element={<CatalogManagementListPage />} />
      <Route path="cluster/create" element={<ClusterCatalogItemCreatePage />} />
      <Route path="compute-instance/create" element={<ComputeInstanceCatalogItemCreatePage />} />
      <Route
        path="baremetal-instance/create"
        element={<BareMetalInstanceCatalogItemCreatePage />}
      />
      <Route path=":type/:id" element={<div />} />
      <Route path=":type/:id/edit" element={<div />} />
    </Routes>
  );
};
