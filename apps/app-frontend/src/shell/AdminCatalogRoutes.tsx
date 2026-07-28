import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import BareMetalInstanceCatalogItemDetailPage from '@osac/ui-components/pages/admin/baremetal-instance/BareMetalInstanceCatalogItemDetailPage';
import CatalogManagementListPage from '@osac/ui-components/pages/admin/CatalogManagementListPage';
import ClusterCatalogItemDetailPage from '@osac/ui-components/pages/admin/cluster/ClusterCatalogItemDetailPage';
import ComputeInstanceCatalogItemDetailPage from '@osac/ui-components/pages/admin/compute-instance/ComputeInstanceCatalogItemDetailPage';

const CatalogItemDetailRoute = () => {
  const { type } = useParams<{ type: string }>();

  switch (type) {
    case 'cluster':
      return <ClusterCatalogItemDetailPage />;
    case 'compute-instance':
      return <ComputeInstanceCatalogItemDetailPage />;
    case 'baremetal-instance':
      return <BareMetalInstanceCatalogItemDetailPage />;
    default:
      return <Navigate to="/admin/catalog" replace />;
  }
};

export const AdminCatalogRoutes = () => {
  return (
    <Routes>
      <Route index element={<CatalogManagementListPage />} />
      <Route path=":type/create" element={<div />} />
      <Route path=":type/:id" element={<CatalogItemDetailRoute />} />
      <Route path=":type/:id/edit" element={<div />} />
    </Routes>
  );
};
