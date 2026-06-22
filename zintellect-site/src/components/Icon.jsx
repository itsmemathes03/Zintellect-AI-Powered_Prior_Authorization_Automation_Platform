import {
  Layers, FileImage, GitBranch, Brain, Gauge, Eye, Users, Shield,
  FileText, Scan, Search, Clock, Zap, Expand, Heart, Smartphone,
  Building2, ChevronDown, Play, ArrowRight, Github,
  UserPlus, ShieldCheck, ClipboardList, FileUp, FileSearch,
  UserCheck, CheckCircle, Scale,
  Lock, Key, Database, Globe, HelpCircle, Server, Activity, Cpu,
  Plus, Minus, ChevronRight, ArrowRightLeft,
} from 'lucide-react'

export const iconMap = {
  Layers, FileImage, GitBranch, Brain, Gauge, Eye, Users, Shield,
  FileText, Scan, Search, Clock, Zap, Expand, Heart, Smartphone,
  Building2, ChevronDown, Play, ArrowRight, Github,
  UserPlus, ShieldCheck, ClipboardList, FileUp, FileSearch,
  UserCheck, CheckCircle, Scale,
  Lock, Key, Database, Globe, HelpCircle, Server, Activity, Cpu,
  Plus, Minus, ChevronRight, ArrowRightLeft,
}

export function Icon({ name, className = 'w-5 h-5', ...props }) {
  const Component = iconMap[name]
  if (!Component) return null
  return <Component className={className} {...props} />
}
