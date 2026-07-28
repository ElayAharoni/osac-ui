import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import BareMetalInstanceCatalogItemCreatePage from '@osac/ui-components/pages/admin/baremetal-instance/BareMetalInstanceCatalogItemCreatePage';
import CatalogManagementListPage from '@osac/ui-components/pages/admin/CatalogManagementListPage';
import ClusterCatalogItemCreatePage from '@osac/ui-components/pages/admin/cluster/ClusterCatalogItemCreatePage';
import ComputeInstanceCatalogItemCreatePage from '@osac/ui-components/pages/admin/compute-instance/ComputeInstanceCatalogItemCreatePage';

const CatalogItemCreateRoute = () => {
  const { type } = useParams<{ type: string }>();

  switch (type) {
    case 'cluster':
      return <ClusterCatalogItemCreatePage />;
    case 'compute-instance':
      return <ComputeInstanceCatalogItemCreatePage />;
    case 'baremetal-instance':
      return <BareMetalInstanceCatalogItemCreatePage />;
    default:
      return <Navigate to="/admin/catalog" replace />;
  }
};

export const AdminCatalogRoutes = () => {
  return (
    <Routes>
      <Route index element={<CatalogManagementListPage />} />
      <Route path=":type/create" element={<CatalogItemCreateRoute />} />
      <Route path=":type/:id" element={<div />} />
      <Route path=":type/:id/edit" element={<div />} />
    </Routes>
  );
};
