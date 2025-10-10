import React, { useState } from 'react';
import { PremiumReport } from '../model/types';
import { subscriptionService } from '../services/subscriptionService';
import { useToast } from '../hooks/useToast';
import { 
  X, 
  Download, 
  FileText, 
  Trophy, 
  PieChart, 
  LineChart, 
  CreditCard, 
  Clock, 
  Users, 
  UserX, 
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getReportIcon = (iconName: string) => {
  const icons: { [key: string]: React.ComponentType<any> } = {
    'trophy': Trophy,
    'chart-pie': PieChart,
    'chart-line': LineChart,
    'cash-register': CreditCard,
    'clock': Clock,
    'users': Users,
    'user-slash': UserX,
    'dollar-sign': DollarSign,
    'file-text': FileText
  };
  
  const IconComponent = icons[iconName] || FileText;
  return <IconComponent className="w-5 h-5" />;
};

export default function ExportReportsModal({ isOpen, onClose }: ExportReportsModalProps) {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const { showToast } = useToast();

  const reports = subscriptionService.getPremiumReports();

  const handleReportToggle = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(report => report.id));
    }
  };

  const handleExport = async () => {
    if (selectedReports.length === 0) {
      showToast('Selecione pelo menos um relatório para exportar', 'error');
      return;
    }

    setIsExporting(true);
    try {
      // Simular exportação (em produção, isso seria uma chamada real para a API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const selectedReportsData = reports.filter(report => selectedReports.includes(report.id));
      const format = exportFormat.toUpperCase();
      
      showToast(
        `${selectedReportsData.length} relatório(s) exportado(s) em formato ${format} com sucesso!`, 
        'success'
      );
      
      onClose();
      setSelectedReports([]);
    } catch (error) {
      showToast('Erro ao exportar relatórios', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Exportar Relatórios Premium
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Formato de Exportação */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Formato de Exportação
            </label>
            <div className="flex space-x-4">
              {[
                { value: 'pdf', label: 'PDF', description: 'Documento visual' },
                { value: 'excel', label: 'Excel', description: 'Planilha editável' },
                { value: 'csv', label: 'CSV', description: 'Dados brutos' }
              ].map(format => (
                <label key={format.value} className="flex items-center">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format.value}
                    checked={exportFormat === format.value}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {format.label}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Seleção de Relatórios */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Relatórios Disponíveis
              </label>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {selectedReports.length === reports.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedReports.includes(report.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleReportToggle(report.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getReportIcon(report.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {report.title}
                        </h3>
                        {selectedReports.includes(report.id) && (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {report.description}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                        report.category === 'sales' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        report.category === 'products' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                        report.category === 'clients' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                        'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                      }`}>
                        {report.category === 'sales' ? 'Vendas' :
                         report.category === 'products' ? 'Produtos' :
                         report.category === 'clients' ? 'Clientes' : 'Análise'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo da Exportação */}
          {selectedReports.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Resumo da Exportação
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                {selectedReports.length} relatório(s) selecionado(s) serão exportados em formato {exportFormat.toUpperCase()}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedReports.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Exportando...
              </div>
            ) : (
              <div className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Exportar {selectedReports.length} Relatório(s)
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
