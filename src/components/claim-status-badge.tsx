
import { ClaimStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ClaimStatusBadge({ status, className }: { status: ClaimStatus; className?: string }) {
  const getStatusColor = (s: ClaimStatus) => {
    switch (s) {
      case 'Declarat':              return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'En validació':          return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'Documentació pendent':  return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'En avaluació':          return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'En peritació':          return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Informe rebut':         return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Aprovat':               return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pagat':                 return 'bg-green-100 text-green-800 border-green-200';
      case 'Tancat':                return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Denegat':               return 'bg-red-100 text-red-800 border-red-200';
      default:                      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium rounded-full", getStatusColor(status), className)}>
      {status}
    </Badge>
  );
}
