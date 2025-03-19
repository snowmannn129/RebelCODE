import { Transform } from '../../Core/Types';
import { EditorPanel } from '../../Core/EditorPanel';
import { EventEmitter } from '../../Core/Events';
import { Panel } from '../../Core/Panel';
import { UIControl, Button } from '../../Core/UIControls';

interface SceneEvents {
    notification: { type: string; message: string };
    sceneChanged: void;
    groupCreated: SceneObject;
    groupDissolved: SceneObject;
}

interface SceneObject {
    id: string;
    transform: Transform;
    children: SceneObject[];
}

interface Template {
    name: string;
    objects: SceneObject[];
    metadata: {
        category: string;
        tags: string[];
        description: string;
    };
}

export class SceneCompositionTools extends EditorPanel {
    private templates: Map<string, Template> = new Map();
    private selectedObjects: SceneObject[] = [];
    private events: EventEmitter<SceneEvents>;

    constructor() {
        super("Scene Composition Tools");
        this.events = new EventEmitter<SceneEvents>();
        this.initializeUI();
    }

    private initializeUI(): void {
        // Template Management Section
        const templateSection = new Panel("Templates");
        const saveButton = new Button("Save as Template", () => this.saveTemplate());
        const loadButton = new Button("Load Template", () => this.showTemplateLoader());
        templateSection.getChildren().push(saveButton);
        templateSection.getChildren().push(loadButton);
        this.createWorkspaceSection("Templates", templateSection);

        // Alignment Tools Section
        const alignmentSection = new Panel("Alignment Tools");
        this.addAlignmentControls(alignmentSection);
        this.createWorkspaceSection("Alignment", alignmentSection);

        // Distribution Tools Section
        const distributionSection = new Panel("Distribution Tools");
        this.addDistributionControls(distributionSection);
        this.createWorkspaceSection("Distribution", distributionSection);

        // Smart Grouping Section
        const groupingSection = new Panel("Smart Grouping");
        this.addGroupingControls(groupingSection);
        this.createWorkspaceSection("Grouping", groupingSection);
    }

    private showTemplateLoader(): void {
        if (this.templates.size === 0) {
            this.events.emit("notification", { type: "warning", message: "No templates available" });
            return;
        }

        // Create a panel to display available templates
        const loaderPanel = new Panel("Load Template");
        Array.from(this.templates.entries()).forEach(([name, template]) => {
            loaderPanel.getChildren().push(
                new Button(name, () => this.loadTemplate(template))
            );
        });
        this.createWorkspaceSection("Template Loader", loaderPanel);
    }

    private loadTemplate(template: Template): void {
        // Clone the template objects to create new instances
        const newObjects = this.cloneObjects(template.objects);
        // Emit event to add objects to scene (implementation depends on scene management system)
        this.events.emit("notification", { type: "success", message: "Template loaded successfully" });
    }

    private addAlignmentControls(panel: Panel): void {
        const alignButtons = [
            { label: "Align Left", action: () => this.alignObjects("left") },
            { label: "Align Center", action: () => this.alignObjects("center") },
            { label: "Align Right", action: () => this.alignObjects("right") },
            { label: "Align Top", action: () => this.alignObjects("top") },
            { label: "Align Middle", action: () => this.alignObjects("middle") },
            { label: "Align Bottom", action: () => this.alignObjects("bottom") }
        ];

        alignButtons.forEach(button => {
            panel.getChildren().push(new Button(button.label, button.action));
        });
    }

    private addDistributionControls(panel: Panel): void {
        const distributionButtons = [
            { label: "Distribute Horizontally", action: () => this.distributeObjects("horizontal") },
            { label: "Distribute Vertically", action: () => this.distributeObjects("vertical") },
            { label: "Distribute Depth", action: () => this.distributeObjects("depth") }
        ];

        distributionButtons.forEach(button => {
            panel.getChildren().push(new Button(button.label, button.action));
        });
    }

    private addGroupingControls(panel: Panel): void {
        panel.getChildren().push(new Button("Group by Type", () => this.groupByType()));
        panel.getChildren().push(new Button("Group by Distance", () => this.groupByDistance()));
        panel.getChildren().push(new Button("Group by Layer", () => this.groupByLayer()));
        panel.getChildren().push(new Button("Ungroup Selection", () => this.ungroupSelection()));
    }

    // Template Management
    public saveTemplate(): void {
        if (this.selectedObjects.length === 0) {
            this.events.emit("notification", { type: "warning", message: "No objects selected to save as template" });
            return;
        }

        const template: Template = {
            name: `Template_${Date.now()}`,
            objects: this.cloneObjects(this.selectedObjects),
            metadata: {
                category: "Custom",
                tags: [],
                description: ""
            }
        };

        this.templates.set(template.name, template);
        this.events.emit("notification", { type: "success", message: "Template saved successfully" });
    }

    private cloneObjects(objects: SceneObject[]): SceneObject[] {
        return objects.map(obj => ({
            id: crypto.randomUUID(),
            transform: { ...obj.transform },
            children: this.cloneObjects(obj.children)
        }));
    }

    // Alignment Tools
    private alignObjects(alignment: string): void {
        if (this.selectedObjects.length < 2) {
            this.events.emit("notification", { type: "warning", message: "Select at least 2 objects to align" });
            return;
        }

        const bounds = this.calculateSelectionBounds();
        
        this.selectedObjects.forEach(obj => {
            switch (alignment) {
                case "left":
                    obj.transform.position.x = bounds.min.x;
                    break;
                case "center":
                    obj.transform.position.x = (bounds.min.x + bounds.max.x) / 2;
                    break;
                case "right":
                    obj.transform.position.x = bounds.max.x;
                    break;
                // Add similar cases for top, middle, bottom
            }
        });

        this.events.emit("sceneChanged", undefined);
    }

    // Distribution Tools
    private distributeObjects(axis: string): void {
        if (this.selectedObjects.length < 3) {
            this.events.emit("notification", { type: "warning", message: "Select at least 3 objects to distribute" });
            return;
        }

        const bounds = this.calculateSelectionBounds();
        const sortedObjects = [...this.selectedObjects].sort((a, b) => {
            switch (axis) {
                case "horizontal":
                    return a.transform.position.x - b.transform.position.x;
                case "vertical":
                    return a.transform.position.y - b.transform.position.y;
                case "depth":
                    return a.transform.position.z - b.transform.position.z;
                default:
                    return 0;
            }
        });

        const step = axis === "horizontal" ? 
            (bounds.max.x - bounds.min.x) / (sortedObjects.length - 1) :
            axis === "vertical" ?
                (bounds.max.y - bounds.min.y) / (sortedObjects.length - 1) :
                (bounds.max.z - bounds.min.z) / (sortedObjects.length - 1);

        sortedObjects.forEach((obj, index) => {
            switch (axis) {
                case "horizontal":
                    obj.transform.position.x = bounds.min.x + (step * index);
                    break;
                case "vertical":
                    obj.transform.position.y = bounds.min.y + (step * index);
                    break;
                case "depth":
                    obj.transform.position.z = bounds.min.z + (step * index);
                    break;
            }
        });

        this.events.emit("sceneChanged", undefined);
    }

    // Smart Grouping
    private groupByType(): void {
        // Group objects based on their component types or other characteristics
        const groups = new Map<string, SceneObject[]>();
        
        this.selectedObjects.forEach(obj => {
            const type = this.determineObjectType(obj);
            if (!groups.has(type)) {
                groups.set(type, []);
            }
            groups.get(type)?.push(obj);
        });

        this.createGroupsFromMap(groups);
    }

    private groupByDistance(): void {
        // Group objects based on their proximity to each other
        const threshold = 5.0; // Configurable distance threshold
        const groups: SceneObject[][] = [];

        this.selectedObjects.forEach(obj => {
            let addedToGroup = false;
            
            for (const group of groups) {
                if (this.isNearGroup(obj, group, threshold)) {
                    group.push(obj);
                    addedToGroup = true;
                    break;
                }
            }

            if (!addedToGroup) {
                groups.push([obj]);
            }
        });

        groups.forEach(group => this.createGroup(group));
    }

    private groupByLayer(): void {
        // Group objects based on their layer assignment
        const groups = new Map<number, SceneObject[]>();
        
        this.selectedObjects.forEach(obj => {
            const layer = this.getObjectLayer(obj);
            if (!groups.has(layer)) {
                groups.set(layer, []);
            }
            groups.get(layer)?.push(obj);
        });

        this.createGroupsFromMap(groups);
    }

    // Helper Methods
    private calculateSelectionBounds(): { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } } {
        const bounds = {
            min: { x: Infinity, y: Infinity, z: Infinity },
            max: { x: -Infinity, y: -Infinity, z: -Infinity }
        };

        this.selectedObjects.forEach(obj => {
            bounds.min.x = Math.min(bounds.min.x, obj.transform.position.x);
            bounds.min.y = Math.min(bounds.min.y, obj.transform.position.y);
            bounds.min.z = Math.min(bounds.min.z, obj.transform.position.z);
            bounds.max.x = Math.max(bounds.max.x, obj.transform.position.x);
            bounds.max.y = Math.max(bounds.max.y, obj.transform.position.y);
            bounds.max.z = Math.max(bounds.max.z, obj.transform.position.z);
        });

        return bounds;
    }

    private determineObjectType(obj: SceneObject): string {
        // Implement logic to determine object type based on components
        return "default";
    }

    private getObjectLayer(obj: SceneObject): number {
        // Implement logic to get object layer
        return 0;
    }

    private isNearGroup(obj: SceneObject, group: SceneObject[], threshold: number): boolean {
        return group.some(groupObj => {
            const dx = obj.transform.position.x - groupObj.transform.position.x;
            const dy = obj.transform.position.y - groupObj.transform.position.y;
            const dz = obj.transform.position.z - groupObj.transform.position.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz) <= threshold;
        });
    }

    private createGroupsFromMap(groups: Map<any, SceneObject[]>): void {
        groups.forEach(group => this.createGroup(group));
    }

    private createGroup(objects: SceneObject[]): void {
        if (objects.length < 2) return;

        const groupObject: SceneObject = {
            id: crypto.randomUUID(),
            transform: this.calculateGroupTransform(objects),
            children: objects
        };

        this.events.emit("groupCreated", groupObject);
    }

    private calculateGroupTransform(objects: SceneObject[]): Transform {
        // Calculate the center point of all objects to position the group
        const center = { x: 0, y: 0, z: 0 };
        objects.forEach(obj => {
            center.x += obj.transform.position.x;
            center.y += obj.transform.position.y;
            center.z += obj.transform.position.z;
        });

        center.x /= objects.length;
        center.y /= objects.length;
        center.z /= objects.length;

        return {
            position: center,
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        };
    }

    private ungroupSelection(): void {
        this.selectedObjects.forEach(obj => {
            if (obj.children.length > 0) {
                this.events.emit("groupDissolved", obj);
            }
        });
    }
}
