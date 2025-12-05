import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, Play, Zap, Send, ChevronRight, ChevronLeft, Maximize2, Minimize2, History } from 'lucide-react';
import { useFlowBuilderStore } from '../store/flowBuilderStore';
import { flowService } from '../services/flow.service';
import { FlowSidebar } from './FlowSidebar';
import { FlowCanvas } from './FlowCanvas';
import { LevelPropertiesPanel } from './LevelPropertiesPanel';
import { BranchingRules } from './BranchingRules';
import { VersionHistory } from '../../versions/components/VersionHistory';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

// Get store instance for accessing state outside of component
const flowBuilderStore = useFlowBuilderStore;

export function FlowBuilder() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    currentFlow,
    setCurrentFlow,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isPropertiesPanelCollapsed,
    setIsPropertiesPanelCollapsed,
    selectedLevel,
    isBranchingRulesOpen,
    setIsBranchingRulesOpen,
  } = useFlowBuilderStore();

  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isTriggersDialogOpen, setIsTriggersDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const isReadOnly = currentFlow?.status === 'PUBLISHED';

  useEffect(() => {
    // Check if we're on the /flows/new route (id will be undefined)
    const isNewRoute = location.pathname === '/flows/new' || id === 'new';
    
    if (id && id !== 'new') {
      loadFlow(id);
    } else if (isNewRoute && !currentFlow) {
      // Create new flow only if we don't already have one
      handleCreateNewFlow();
    }
  }, [id, location.pathname]);

  const loadFlow = async (flowId: string) => {
    try {
      const flow = await flowService.getFlow(flowId);
      setCurrentFlow(flow);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load flow:', error);
      showToast({
        title: 'Failed to load flow',
        description: 'Please try again or select a different flow.',
        status: 'error',
      });
      navigate('/flows');
    }
  };

  const handleCreateNewFlow = async () => {
    try {
      const newFlow = await flowService.createFlow({
        name: 'New Flow',
        description: '',
      });
      setCurrentFlow(newFlow);
      setHasUnsavedChanges(false);
      navigate(`/flows/${newFlow.id}`, { replace: true });
    } catch (error: any) {
      console.error('Failed to create flow:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to create flow';
      showToast({
        title: 'Failed to create flow',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleSave = async () => {
    // Get the latest flow state from the store (might have been updated)
    const latestFlow = flowBuilderStore.getState().currentFlow;
    if (!latestFlow) return;

    try {
      if (latestFlow.id) {
        // Get current levels sorted by their order property
        // After drag-and-drop, the order property is updated to reflect the new position
        // So sorting by order gives us the visual order
        const allLevels = [...latestFlow.levels].sort((a, b) => a.order - b.order);
        
        console.log('Saving flow - current levels order:', allLevels.map(l => ({ id: l.id, name: l.name, order: l.order })));
        
        // First, save any new levels (those with temp- IDs)
        const tempLevels = allLevels.filter((level) => level.id.startsWith('temp-'));
        const tempToRealIdMap = new Map<string, string>();
        
        // Store the desired order for each temp level (by position in allLevels)
        const tempLevelOrderMap = new Map<string, number>();
        allLevels.forEach((level, index) => {
          if (level.id.startsWith('temp-')) {
            tempLevelOrderMap.set(level.id, index);
          }
        });
        
        for (const level of tempLevels) {
          try {
            // Save temp level - use a high order number temporarily, we'll reorder everything after
            const updatedFlow = await flowService.addLevel(latestFlow.id, {
              name: level.name,
              description: level.description,
              order: 9999, // Temporary high order, will be fixed by reorder
              config: level.config,
            });
            
            // Get the newly created level ID from the response
            // The addLevel response includes all levels, so we need to find the one we just created
            // Strategy: find a level that matches by name and has order 9999 (our temp order)
            const newLevel = updatedFlow.levels
              .filter((l) => !l.id.startsWith('temp-'))
              .find((l) => l.name === level.name && l.order === 9999);
            
            if (newLevel) {
              tempToRealIdMap.set(level.id, newLevel.id);
              console.log(`Mapped temp level ${level.id} to real ID ${newLevel.id} (name: ${level.name})`);
            } else {
              // Fallback: reload the flow and find the level by name and high order
              const reloadedFlow = await flowService.getFlow(latestFlow.id);
              const fallbackLevel = reloadedFlow.levels
                .filter((l) => !l.id.startsWith('temp-'))
                .find((l) => l.name === level.name && l.order === 9999);
              
              if (fallbackLevel) {
                tempToRealIdMap.set(level.id, fallbackLevel.id);
                console.log(`Mapped temp level ${level.id} to real ID ${fallbackLevel.id} via fallback (name: ${level.name})`);
              } else {
                console.error(`Failed to find real ID for temp level ${level.id} (name: ${level.name})`);
                throw new Error(`Failed to save level: ${level.name}. Could not find the created level ID.`);
              }
            }
          } catch (error) {
            console.error('Failed to save level:', error);
            throw error;
          }
        }

        // Verify all temp levels were mapped
        if (tempLevels.length > 0 && tempToRealIdMap.size !== tempLevels.length) {
          const unmapped = tempLevels.filter(l => !tempToRealIdMap.has(l.id));
          console.error('Some temp levels were not mapped to real IDs:', unmapped.map(l => ({ id: l.id, name: l.name })));
          throw new Error(`Failed to map all temp levels to real IDs. Unmapped: ${unmapped.map(l => l.name).join(', ')}`);
        }

        // CRITICAL: Reload the flow after saving temp levels to get the actual current state
        // This ensures we have all the real IDs and the current order from the database
        // Only reload if we saved temp levels, otherwise use the existing flow state
        let flowAfterTempSave = latestFlow;
        if (tempLevels.length > 0) {
          flowAfterTempSave = await flowService.getFlow(latestFlow.id);
          console.log('Flow after saving temp levels:', flowAfterTempSave.levels.map(l => ({ id: l.id, name: l.name, order: l.order })));
        } else {
          console.log('No temp levels to save, using existing flow state');
          console.log('Current flow levels:', flowAfterTempSave.levels.map(l => ({ id: l.id, name: l.name, order: l.order })));
        }
        
        // Build the ordered level IDs array by matching levels from allLevels to flowAfterTempSave
        // We need to preserve the visual order from allLevels but use the real IDs from the database
        const orderedLevelIds: string[] = [];
        
        // Create a map of name+description to help match levels (in case there are duplicates)
        // But primarily match by the temp ID mapping we created
        const allLevelsInOrder = [...allLevels]; // Preserve the visual order
        
        for (let i = 0; i < allLevelsInOrder.length; i++) {
          const level = allLevelsInOrder[i];
          
          if (level.id.startsWith('temp-')) {
            // This is a temp level - use the mapped real ID
            const realId = tempToRealIdMap.get(level.id);
            if (realId) {
              // Verify this ID exists in the reloaded flow
              const levelInFlow = flowAfterTempSave.levels.find(l => l.id === realId);
              if (levelInFlow) {
                orderedLevelIds.push(realId);
                console.log(`[${i}] Mapped temp ${level.id} → real ${realId} (${level.name})`);
              } else {
                console.error(`Mapped real ID ${realId} does not exist in reloaded flow for temp level ${level.id} (${level.name})`);
                console.error('Available levels in flow:', flowAfterTempSave.levels.map(l => ({ id: l.id, name: l.name })));
                throw new Error(`Mapped level ID ${realId} not found in flow after save`);
              }
            } else {
              console.error(`No real ID found for temp level ${level.id} (name: ${level.name})`);
              throw new Error(`Failed to find real ID for temp level: ${level.name}`);
            }
          } else {
            // This is an existing level - verify the ID exists in the reloaded flow
            const levelInFlow = flowAfterTempSave.levels.find(l => l.id === level.id);
            if (levelInFlow) {
              // Verify it's a valid UUID
              if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(level.id)) {
                console.error(`Invalid level ID format: ${level.id}`);
                throw new Error(`Invalid level ID: ${level.id}`);
              }
              orderedLevelIds.push(level.id);
              console.log(`[${i}] Using existing level ID ${level.id} (${level.name})`);
            } else {
              // Level ID doesn't exist - this could happen if a level was deleted
              // Try to find it by name as a fallback
              const levelByName = flowAfterTempSave.levels.find(l => l.name === level.name);
              if (levelByName) {
                console.warn(`Level ID ${level.id} not found, but found level with same name: ${levelByName.id}`);
                orderedLevelIds.push(levelByName.id);
                console.log(`[${i}] Using level found by name: ${levelByName.id} (${level.name})`);
              } else {
                console.error(`Level ID ${level.id} (${level.name}) does not exist in reloaded flow`);
                console.error('Available level IDs:', flowAfterTempSave.levels.map(l => ({ id: l.id, name: l.name })));
                console.error('All levels from store:', allLevels.map(l => ({ id: l.id, name: l.name })));
                throw new Error(`Level ${level.name} (ID: ${level.id}) not found in flow after reload`);
              }
            }
          }
        }
        
        console.log('Ordered level IDs for reorder:', orderedLevelIds);
        console.log('Total levels to reorder:', orderedLevelIds.length);
        console.log('Flow has', flowAfterTempSave.levels.length, 'levels in database');
        console.log('Flow level IDs:', flowAfterTempSave.levels.map(l => l.id));
        
        // Final validation: ensure we have the same number of levels
        if (orderedLevelIds.length !== flowAfterTempSave.levels.length) {
          console.error('❌ Level count mismatch!');
          console.error('Ordered IDs count:', orderedLevelIds.length);
          console.error('Flow levels count:', flowAfterTempSave.levels.length);
          console.error('Ordered IDs:', orderedLevelIds);
          console.error('Flow level IDs:', flowAfterTempSave.levels.map(l => l.id));
          throw new Error(`Level count mismatch: trying to reorder ${orderedLevelIds.length} levels but flow has ${flowAfterTempSave.levels.length} levels`);
        }
        
        // Additional validation: ensure all IDs in orderedLevelIds exist in flowAfterTempSave
        const missingIds = orderedLevelIds.filter(id => !flowAfterTempSave.levels.some(l => l.id === id));
        if (missingIds.length > 0) {
          console.error('❌ Some IDs in reorder array do not exist in flow!');
          console.error('Missing IDs:', missingIds);
          console.error('Ordered IDs:', orderedLevelIds);
          console.error('Flow level IDs:', flowAfterTempSave.levels.map(l => l.id));
          throw new Error(`Some level IDs do not exist in flow: ${missingIds.join(', ')}`);
        }
        
        console.log('✅ All validations passed - ready to reorder');

        // Always reorder ALL levels to match the current display order
        // This ensures the order is preserved after saving, even if it was just loaded
        // The order property in the store reflects the visual order after drag-and-drop
        if (orderedLevelIds.length > 0) {
          try {
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔄 REORDERING LEVELS');
            console.log('═══════════════════════════════════════════════════════');
            console.log('Flow ID:', latestFlow.id);
            console.log('Level IDs to reorder:', orderedLevelIds);
            console.log('Level count:', orderedLevelIds.length);
            console.log('Level names in order:', allLevels.map(l => l.name));
            console.log('═══════════════════════════════════════════════════════');
            
            // Call reorder API
            const reorderResponse = await flowService.reorderLevels(latestFlow.id, orderedLevelIds);
            console.log('✅ Reorder API call successful');
            console.log('Reordered flow levels order:', reorderResponse.levels.map(l => ({ id: l.id, name: l.name, order: l.order })));
            
            // Verify the order was saved by reloading
            const reorderedFlow = await flowService.getFlow(latestFlow.id);
            console.log('Flow reloaded after reorder, levels order:', reorderedFlow.levels.map(l => ({ id: l.id, name: l.name, order: l.order })));
            
            // Check if order matches what we sent
            const expectedOrder = orderedLevelIds;
            const actualOrder = reorderedFlow.levels.map(l => l.id);
            const orderMatches = JSON.stringify(expectedOrder) === JSON.stringify(actualOrder);
            
            if (!orderMatches) {
          console.error('Order mismatch after reorder!');
              console.error('Expected:', expectedOrder);
              console.error('Actual:', actualOrder);
              showToast({
                title: 'Warning: level order may not be saved',
                description: 'Check the browser console for details.',
                status: 'warning',
              });
            } else {
              console.log('✓ Order verified - matches expected order');
            }
            
            // Update local state with the reordered flow to keep UI in sync
            setCurrentFlow(reorderedFlow);
            
            // IMPORTANT: Update level properties and flow metadata WITHOUT touching the order
            // The order has already been set by reorderLevels, so we only update name, description, and config.
            // Use the latest in-memory flow (with any name/description edits) rather than the just-reloaded one.
            const storeFlow = latestFlow;
            if (storeFlow) {
              // Update level properties (name, description, config) - this does NOT affect order
              for (const storeLevel of storeFlow.levels) {
                if (!storeLevel.id.startsWith('temp-')) {
                  try {
                    const backendLevel = reorderedFlow.levels.find(l => l.id === storeLevel.id);
                    if (backendLevel) {
                      // Only update if there are actual changes to name, description, or config
                      const nameChanged = storeLevel.name !== backendLevel.name;
                      const descChanged = storeLevel.description !== backendLevel.description;
                      const configChanged = JSON.stringify(storeLevel.config || {}) !== JSON.stringify(backendLevel.config || {});
                      
                      if (nameChanged || descChanged || configChanged) {
                        console.log(`Updating level ${storeLevel.id}:`, { nameChanged, descChanged, configChanged });
                        await flowService.updateLevel(latestFlow.id, storeLevel.id, {
                          name: storeLevel.name,
                          description: storeLevel.description,
                          config: storeLevel.config,
                        });
                        // Note: updateLevel does NOT touch the order field, so order is preserved
                      }
                    }
                  } catch (error) {
                    console.error('Failed to update level:', error);
                    // Don't throw - continue with other levels
                  }
                }
              }

              // Update flow metadata (name, description, config) - this also does NOT affect level order
              const flowNameChanged = storeFlow.name !== reorderedFlow.name;
              const flowDescChanged = storeFlow.description !== reorderedFlow.description;
              const flowConfigChanged = JSON.stringify(storeFlow.config || {}) !== JSON.stringify(reorderedFlow.config || {});
              
              if (flowNameChanged || flowDescChanged || flowConfigChanged) {
                console.log('Updating flow metadata:', { flowNameChanged, flowDescChanged, flowConfigChanged });
                await flowService.updateFlow(latestFlow.id, {
                  name: storeFlow.name,
                  description: storeFlow.description,
                  config: storeFlow.config,
                });
              }
            }

            // Final reload to get all updated data with correct order
            const finalFlow = await flowService.getFlow(latestFlow.id);
            console.log('Final flow reloaded after save, levels order:', finalFlow.levels.map(l => ({ id: l.id, name: l.name, order: l.order })));
            
            // Verify order one more time - this is critical
            const finalOrder = finalFlow.levels.map(l => l.id);
            const finalOrderMatches = JSON.stringify(expectedOrder) === JSON.stringify(finalOrder);
            
            if (!finalOrderMatches) {
              console.error('❌ CRITICAL: Order mismatch in final reload!');
              console.error('Expected order:', expectedOrder);
              console.error('Actual order:', finalOrder);
              console.error('This indicates the order was not properly saved to the database.');
              showToast({
                title: 'Warning: level order may not be saved',
                description: 'Check the browser console for details.',
                status: 'warning',
              });
            } else {
              console.log('✅ Order verified - matches expected order in final reload');
            }
            
            setCurrentFlow(finalFlow);
            setHasUnsavedChanges(false);
            showToast({
              title: 'Flow saved',
              description: 'Your flow changes have been saved successfully.',
              status: 'success',
            });
            return;
          } catch (error: any) {
            console.error('═══════════════════════════════════════════════════════');
            console.error('❌ REORDER FAILED');
            console.error('═══════════════════════════════════════════════════════');
            console.error('Error:', error);
            console.error('Error message:', error?.message);
            console.error('Error response:', error?.response?.data);
            console.error('Error status:', error?.response?.status);
            console.error('Flow ID:', latestFlow.id);
            console.error('Level IDs that were sent:', orderedLevelIds);
            console.error('Level IDs in database:', flowAfterTempSave.levels.map(l => l.id));
            console.error('Level names in database:', flowAfterTempSave.levels.map(l => l.name));
            
            // Check which IDs are missing
            const missingIds = orderedLevelIds.filter(id => !flowAfterTempSave.levels.some(l => l.id === id));
            if (missingIds.length > 0) {
              console.error('Missing IDs:', missingIds);
            }
            
            // Check for extra IDs
            const extraIds = flowAfterTempSave.levels.map(l => l.id).filter(id => !orderedLevelIds.includes(id));
            if (extraIds.length > 0) {
              console.error('Extra IDs in database (not in reorder array):', extraIds);
            }
            
            console.error('═══════════════════════════════════════════════════════');
            
            const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to reorder levels';
            // Show error but don't throw - continue with saving other changes
            showToast({
              title: 'Warning: failed to save level order',
              description: `${errorMessage}. Other changes were saved.`,
              status: 'warning',
            });
          }
        }

      }
    } catch (error: any) {
      console.error('Failed to save flow:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to save flow';
      showToast({
        title: 'Failed to save flow',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  const handleTest = () => {
    if (!currentFlow) return;
    setIsTestDialogOpen(true);
  };

  const handleTriggers = () => {
    if (!currentFlow) return;
    setIsTriggersDialogOpen(true);
  };

  const handlePublish = async () => {
    if (!currentFlow?.id) return;
    if (!confirm('Are you sure you want to publish this flow?')) return;

    try {
      await flowService.publishFlow(currentFlow.id);
      showToast({
        title: 'Flow published',
        description: 'This flow is now available as a published workflow.',
        status: 'success',
      });
      // Reload flow to get updated status
      await loadFlow(currentFlow.id);
    } catch (error) {
      console.error('Failed to publish flow:', error);
      showToast({
        title: 'Failed to publish flow',
        description: 'Please try again after fixing any validation issues.',
        status: 'error',
      });
    }
  };

  return (
    <div className="flex h-screen flex-col -m-8">
      {/* Top Bar */}
      <div className="flex h-16 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">
              {currentFlow?.name || 'Flow Builder'}
            </h1>
            {isReadOnly && (
              <Badge variant="outline" className="text-xs">
                Published · read only
              </Badge>
            )}
          </div>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentFlow && currentFlow.id && (
            <Button
              onClick={() => setIsVersionHistoryOpen(true)}
              variant="outline"
              size="default"
            >
              <History className="size-4" />
              Version History
            </Button>
          )}
          <Button
            onClick={() => setIsFocusMode((prev) => !prev)}
            variant="outline"
            size="sm"
          >
            {isFocusMode ? (
              <>
                <Minimize2 className="size-4" />
                <span className="hidden sm:inline">Exit focus</span>
              </>
            ) : (
              <>
                <Maximize2 className="size-4" />
                <span className="hidden sm:inline">Focus canvas</span>
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isReadOnly || !hasUnsavedChanges}
            size="default"
          >
            <Save className="size-4" />
            Save
          </Button>
          <Button
            onClick={handleTest}
            variant="outline"
            size="default"
          >
            <Play className="size-4" />
            Test
          </Button>
          <Button
            onClick={handleTriggers}
            variant="outline"
            size="default"
          >
            <Zap className="size-4" />
            Triggers
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!currentFlow || currentFlow.status === 'PUBLISHED'}
            variant="secondary"
            size="default"
          >
            <Send className="size-4" />
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4 bg-background">
        {/* Left Sidebar - Flow Switcher */}
        {!isFocusMode && (
          <div className="w-64 flex-shrink-0">
            <FlowSidebar />
          </div>
        )}

        {/* Center - Flow Canvas */}
        <div className="min-w-0 flex-1">
          <FlowCanvas />
        </div>

        {/* Right Sidebar - Level details (Properties / Branches) */}
        {!isFocusMode && (
          <>
            <div
              className={`relative ${
                isPropertiesPanelCollapsed ? 'w-0' : 'w-96'
              } overflow-hidden transition-all duration-300`}
            >
              {!isPropertiesPanelCollapsed && (
                <>
                  {selectedLevel ? (
                    <Tabs
                      value={isBranchingRulesOpen ? 'branches' : 'properties'}
                      onValueChange={(value) => setIsBranchingRulesOpen(value === 'branches')}
                      className="h-full"
                    >
                      <TabsList className="mx-4 mt-4">
                        <TabsTrigger value="properties">
                          Properties
                        </TabsTrigger>
                        <TabsTrigger value="branches">
                          Branches
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="properties" className="m-0 mt-0 h-[calc(100%-3rem)]">
                        <LevelPropertiesPanel />
                      </TabsContent>
                      <TabsContent value="branches" className="m-0 mt-0 h-[calc(100%-3rem)]">
                        <BranchingRules
                          level={selectedLevel}
                          onClose={() => setIsBranchingRulesOpen(false)}
                        />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border border-border/50 bg-card px-6 text-sm text-muted-foreground text-center">
                      Select a level to view its properties and branches.
                    </div>
                  )}
                  <Button
                    onClick={() => setIsPropertiesPanelCollapsed(true)}
                    variant="outline"
                    size="icon-sm"
                    className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </>
              )}
            </div>
            {isPropertiesPanelCollapsed && (
              <Button
                onClick={() => setIsPropertiesPanelCollapsed(false)}
                variant="outline"
                size="icon"
                className="h-full"
              >
                <ChevronLeft className="size-4" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Flow test summary dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Flow test summary</DialogTitle>
            <DialogDescription>
              High-level overview of how this flow will behave when started.
            </DialogDescription>
          </DialogHeader>
          {currentFlow && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={currentFlow.status === 'PUBLISHED' ? 'default' : 'outline'}>
                  {currentFlow.status}
                </Badge>
                {currentFlow.levels.length > 0 && (
                  <span className="text-muted-foreground">
                    {currentFlow.levels.length} levels •{' '}
                    {currentFlow.branches.length} branches
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Execution path</p>
                <p className="text-muted-foreground">
                  Levels will execute in the order shown in the canvas. Branching rules
                  will control which level to move to next based on the configured
                  conditions.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Next steps</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>Ensure each level has the correct tasks and roles assigned.</li>
                  <li>Configure branching rules for non-linear flows.</li>
                  <li>Use triggers to automate actions when key events happen.</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Triggers info dialog */}
      <Dialog open={isTriggersDialogOpen} onOpenChange={setIsTriggersDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Flow triggers</DialogTitle>
            <DialogDescription>
              Triggers can be attached at the level or task level to automate work.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              To create or edit triggers, open a level and use the{' '}
              <span className="font-medium text-foreground">
                &quot;Auto Actions / Triggers&quot;
              </span>{' '}
              section. Each trigger can define conditions and actions using the Trigger
              Builder.
            </p>
            <p>
              This overview is just informational for now; the full trigger editing flow
              is available directly inside each level card.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      {currentFlow && currentFlow.id && (
        <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Version History: {currentFlow.name}</DialogTitle>
            </DialogHeader>
            <VersionHistory entityType="Flow" entityId={currentFlow.id} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

