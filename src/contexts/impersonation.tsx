import React, { createContext, useContext, useState, useEffect } from "react";

interface ImpersonationContextType {
    impersonatedCompanyId: string | null;
    setImpersonatedCompanyId: (id: string | null) => void;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
    impersonatedCompanyId: null,
    setImpersonatedCompanyId: () => { },
});

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(() => {
        return localStorage.getItem("impersonated_company_id");
    });

    useEffect(() => {
        if (impersonatedCompanyId) {
            localStorage.setItem("impersonated_company_id", impersonatedCompanyId);
        } else {
            localStorage.removeItem("impersonated_company_id");
        }
    }, [impersonatedCompanyId]);

    return (
        <ImpersonationContext.Provider value={{ impersonatedCompanyId, setImpersonatedCompanyId }}>
            {children}
        </ImpersonationContext.Provider>
    );
};

export const useImpersonation = () => useContext(ImpersonationContext);
