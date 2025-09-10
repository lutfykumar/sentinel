import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, X, Trash2, Eye, Calendar, User } from 'lucide-react';
import { RuleGroupType } from 'react-querybuilder';
import { ruleSetService, RuleSetData } from '@/services/ruleSetService';
import useAuth from '@/hooks/useAuth';

interface LoadRuleSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (rules: RuleGroupType, name: string) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function LoadRuleSetModal({
  isOpen,
  onClose,
  onLoad,
  onSuccess,
  onError
}: LoadRuleSetModalProps) {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [ruleSets, setRuleSets] = useState<RuleSetData[]>([]);
  const [adminRuleSets, setAdminRuleSets] = useState<RuleSetData[]>([]);

  const canManageAll = hasPermission('rulesets.manage');
  const canDelete = hasPermission('rulesets.delete');

  useEffect(() => {
    if (isOpen) {
      loadRuleSets();
    }
  }, [isOpen]);

  const loadRuleSets = async () => {
    setLoading(true);
    try {
      const userRuleSets = await ruleSetService.getRuleSets();
      setRuleSets(userRuleSets);

      // Load admin rule sets if user has permission
      if (canManageAll) {
        try {
          const adminData = await ruleSetService.getAllRuleSets();
          setAdminRuleSets(adminData.data || []);
        } catch (error) {
          // Ignore admin fetch errors for now
          console.warn('Could not load admin rule sets:', error);
        }
      }
    } catch (error: any) {
      onError('Failed to load rule sets');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = (ruleSet: RuleSetData) => {
    onLoad(ruleSet.rules, ruleSet.name);
    onSuccess(`Loaded rule set: ${ruleSet.name}`);
    onClose();
  };

  const handleDelete = async (ruleSet: RuleSetData) => {
    if (!window.confirm(`Are you sure you want to delete "${ruleSet.name}"?`)) {
      return;
    }

    setDeleting(ruleSet.id);
    try {
      await ruleSetService.deleteRuleSet(ruleSet.id);
      onSuccess(`Deleted rule set: ${ruleSet.name}`);
      await loadRuleSets(); // Refresh the list
    } catch (error: any) {
      onError('Failed to delete rule set');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Load Rule Set
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <span>Loading rule sets...</span>
            </div>
          ) : (
            <div className="space-y-6 h-full overflow-auto">
              {/* User's Rule Sets */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  My Rule Sets ({ruleSets.length})
                </h3>
                {ruleSets.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No saved rule sets found. Create one by building a query and clicking "Save Rule Set".
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ruleSets.map((ruleSet) => (
                      <div
                        key={ruleSet.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{ruleSet.name}</h4>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoad(ruleSet)}
                              className="h-8 w-8 p-0"
                              title="Load Rule Set"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(ruleSet)}
                                disabled={deleting === ruleSet.id}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Delete Rule Set"
                              >
                                {deleting === ruleSet.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        {ruleSet.description && (
                          <p className="text-sm text-muted-foreground mb-2">{ruleSet.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(ruleSet.created_at)}
                          </span>
                          <span>{ruleSet.is_public ? 'Public' : 'Private'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Rule Sets */}
              {canManageAll && adminRuleSets.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    All Rule Sets ({adminRuleSets.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {adminRuleSets.map((ruleSet) => (
                      <div
                        key={`admin-${ruleSet.id}`}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors border-orange-200 bg-orange-50/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{ruleSet.name}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoad(ruleSet)}
                            className="h-8 w-8 p-0"
                            title="Load Rule Set"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        {ruleSet.description && (
                          <p className="text-sm text-muted-foreground mb-2">{ruleSet.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(ruleSet.created_at)}
                          </span>
                          <span>
                            By {ruleSet.user?.name || 'Unknown'} • {ruleSet.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
