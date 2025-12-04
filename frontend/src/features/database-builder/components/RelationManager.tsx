import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function RelationManager() {
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Relations</h3>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Relation
        </Button>
      </div>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground text-center py-4">
          Relations feature coming soon. You'll be able to define relationships between tables here.
        </p>
      </Card>
    </div>
  );
}

