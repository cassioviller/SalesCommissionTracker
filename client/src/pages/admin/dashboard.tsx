import { useEffect } from "react";
import { useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  
  // Redirecionar para a página principal de propostas
  useEffect(() => {
    navigate("/propostas");
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      <div className="container mx-auto py-12 px-4 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="ml-2">Redirecionando...</p>
      </div>
    </div>
  );
}