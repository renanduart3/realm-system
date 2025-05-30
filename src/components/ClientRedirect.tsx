import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOrganizationType } from '../hooks/useOrganizationType';

const ClientRedirect = () => {
    const isProfit = useOrganizationType();
    return <Navigate to={isProfit ? "/clients" : "/persons"} replace />;
};

export default ClientRedirect; 