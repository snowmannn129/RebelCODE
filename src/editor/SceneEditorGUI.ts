import { SceneEditor, SceneObject } from './SceneEditor';
import { Vector3, Quaternion } from '../../Core/Math';

export class SceneEditorGUI {
    private editor: SceneEditor;
    private container: HTMLElement;
    private viewportContainer: HTMLElement;
    private hierarchyPanel: HTMLElement;
    private inspectorPanel: HTMLElement;
    private toolbarContainer: HTMLElement;
    private isDragging: boolean = false;
    private selectedTool: 'translate' | 'rotate' | 'scale' = 'translate';

    constructor(containerId: string) {
        this.editor = new SceneEditor();
        this.container = document.getElementById(containerId) || document.createElement('div');
        this.setupLayout();
        this.setupEventListeners();
    }

    private setupLayout(): void {
        this.container.style.display = 'grid';
        this.container.style.gridTemplateColumns = '250px 1fr 300px';
        this.container.style.gridTemplateRows = '40px 1fr';
        this.container.style.gap = '1px';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#1e1e1e';
        this.container.style.color = '#ffffff';

        // Toolbar
        this.toolbarContainer = this.createToolbar();
        this.container.appendChild(this.toolbarContainer);

        // Scene Hierarchy
        this.hierarchyPanel = this.createHierarchyPanel();
        this.container.appendChild(this.hierarchyPanel);

        // Viewport
        this.viewportContainer = this.createViewport();
        this.container.appendChild(this.viewportContainer);

        // Property Inspector
        this.inspectorPanel = this.createInspectorPanel();
        this.container.appendChild(this.inspectorPanel);
    }

    private createToolbar(): HTMLElement {
        const toolbar = document.createElement('div');
        toolbar.style.gridColumn = '1 / -1';
        toolbar.style.padding = '5px';
        toolbar.style.backgroundColor = '#2d2d2d';
        toolbar.style.display = 'flex';
        toolbar.style.alignItems = 'center';
        toolbar.style.gap = '10px';

        // Transform Tools
        const tools = ['translate', 'rotate', 'scale'];
        tools.forEach(tool => {
            const button = document.createElement('button');
            button.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
            button.style.padding = '5px 10px';
            button.style.backgroundColor = tool === this.selectedTool ? '#4a4a4a' : '#3a3a3a';
            button.style.border = 'none';
            button.style.color = '#ffffff';
            button.style.cursor = 'pointer';
            button.onclick = () => this.setTransformTool(tool as 'translate' | 'rotate' | 'scale');
            toolbar.appendChild(button);
        });

        // Add Object Button
        const addButton = document.createElement('button');
        addButton.textContent = 'Add Object';
        addButton.style.marginLeft = 'auto';
        addButton.style.padding = '5px 10px';
        addButton.style.backgroundColor = '#3a3a3a';
        addButton.style.border = 'none';
        addButton.style.color = '#ffffff';
        addButton.style.cursor = 'pointer';
        addButton.onclick = () => this.createNewObject();
        toolbar.appendChild(addButton);

        return toolbar;
    }

    private createHierarchyPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.style.backgroundColor = '#252525';
        panel.style.padding = '10px';
        panel.style.overflowY = 'auto';

        const header = document.createElement('div');
        header.textContent = 'Scene Hierarchy';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '10px';
        panel.appendChild(header);

        const hierarchyTree = document.createElement('div');
        hierarchyTree.id = 'hierarchy-tree';
        panel.appendChild(hierarchyTree);

        return panel;
    }

    private createViewport(): HTMLElement {
        const viewport = document.createElement('div');
        viewport.style.backgroundColor = '#1a1a1a';
        viewport.style.position = 'relative';

        // Viewport Camera Controls
        const cameraControls = document.createElement('div');
        cameraControls.style.position = 'absolute';
        cameraControls.style.top = '10px';
        cameraControls.style.right = '10px';
        cameraControls.style.display = 'flex';
        cameraControls.style.gap = '5px';

        ['Top', 'Front', 'Side', 'Perspective'].forEach(view => {
            const button = document.createElement('button');
            button.textContent = view;
            button.style.padding = '5px 10px';
            button.style.backgroundColor = '#3a3a3a';
            button.style.border = 'none';
            button.style.color = '#ffffff';
            button.style.cursor = 'pointer';
            button.onclick = () => this.setViewportCamera(view.toLowerCase());
            cameraControls.appendChild(button);
        });

        viewport.appendChild(cameraControls);
        return viewport;
    }

    private createInspectorPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.style.backgroundColor = '#252525';
        panel.style.padding = '10px';
        panel.style.overflowY = 'auto';

        const header = document.createElement('div');
        header.textContent = 'Properties';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '10px';
        panel.appendChild(header);

        const propertiesContainer = document.createElement('div');
        propertiesContainer.id = 'properties-container';
        panel.appendChild(propertiesContainer);

        return panel;
    }

    private setupEventListeners(): void {
        // Viewport interaction events
        this.viewportContainer.addEventListener('mousedown', this.onViewportMouseDown.bind(this));
        document.addEventListener('mousemove', this.onViewportMouseMove.bind(this));
        document.addEventListener('mouseup', this.onViewportMouseUp.bind(this));
        this.viewportContainer.addEventListener('wheel', this.onViewportWheel.bind(this));

        // Update loop
        requestAnimationFrame(this.update.bind(this));
    }

    private setTransformTool(tool: 'translate' | 'rotate' | 'scale'): void {
        this.selectedTool = tool;
        // Update toolbar button states
        const buttons = this.toolbarContainer.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.textContent?.toLowerCase() === tool) {
                button.style.backgroundColor = '#4a4a4a';
            } else if (['Translate', 'Rotate', 'Scale'].includes(button.textContent || '')) {
                button.style.backgroundColor = '#3a3a3a';
            }
        });
    }

    private createNewObject(): void {
        const name = `Object_${Math.floor(Math.random() * 1000)}`;
        const id = this.editor.createObject(name);
        this.updateHierarchyView();
        this.editor.selectObject(id);
        this.updateInspector();
    }

    private setViewportCamera(view: string): void {
        // Implementation for camera view changes
        // This would interact with the 3D rendering system
        console.log(`Changing camera to ${view} view`);
    }

    private updateHierarchyView(): void {
        const hierarchyTree = document.getElementById('hierarchy-tree');
        if (!hierarchyTree) return;

        // Clear current hierarchy view
        hierarchyTree.innerHTML = '';

        // Recursively build hierarchy tree
        const buildHierarchyElement = (object: SceneObject, level: number = 0): HTMLElement => {
            const element = document.createElement('div');
            element.style.paddingLeft = `${level * 20}px`;
            element.style.padding = '5px';
            element.style.cursor = 'pointer';
            element.textContent = object.name;
            
            if (object.id === this.editor.getSelectedObjectId()) {
                element.style.backgroundColor = '#3a3a3a';
            }

            element.onclick = () => {
                this.editor.selectObject(object.id);
                this.updateHierarchyView();
                this.updateInspector();
            };

            return element;
        };

        // Add hierarchy elements
        // Note: This would need to be updated to work with the actual hierarchy data structure
        const objects = Array.from(this.editor.getObjects().values());
        objects.forEach(object => {
            if (!object.parentId) { // Root level objects
                const element = buildHierarchyElement(object);
                hierarchyTree.appendChild(element);

                // Add children recursively
                const addChildren = (parentObject: SceneObject, level: number) => {
                    parentObject.children.forEach(childId => {
                        const childObject = this.editor.getObjects().get(childId);
                        if (childObject) {
                            const childElement = buildHierarchyElement(childObject, level);
                            hierarchyTree.appendChild(childElement);
                            addChildren(childObject, level + 1);
                        }
                    });
                };

                addChildren(object, 1);
            }
        });
    }

    private updateInspector(): void {
        const propertiesContainer = document.getElementById('properties-container');
        if (!propertiesContainer) return;

        propertiesContainer.innerHTML = '';

        const selectedObject = this.editor.getSelectedObjectId()
            ? this.editor.getObjects().get(this.editor.getSelectedObjectId() || '')
            : null;

        if (!selectedObject) {
            propertiesContainer.innerHTML = '<div style="color: #666;">No object selected</div>';
            return;
        }

        // Name field
        this.createPropertyField(propertiesContainer, 'Name', selectedObject.name, (value) => {
            if (selectedObject) selectedObject.name = value;
            this.updateHierarchyView();
        });

        // Transform properties
        this.createVectorField(propertiesContainer, 'Position', selectedObject.position, (value) => {
            if (selectedObject) selectedObject.position = value;
        });

        this.createVectorField(propertiesContainer, 'Scale', selectedObject.scale, (value) => {
            if (selectedObject) selectedObject.scale = value;
        });

        // Components section
        const componentsHeader = document.createElement('div');
        componentsHeader.textContent = 'Components';
        componentsHeader.style.fontWeight = 'bold';
        componentsHeader.style.marginTop = '20px';
        componentsHeader.style.marginBottom = '10px';
        propertiesContainer.appendChild(componentsHeader);

        selectedObject.components.forEach((data, type) => {
            const componentContainer = document.createElement('div');
            componentContainer.style.marginBottom = '10px';
            componentContainer.style.padding = '5px';
            componentContainer.style.backgroundColor = '#2a2a2a';

            const header = document.createElement('div');
            header.textContent = type;
            header.style.marginBottom = '5px';
            componentContainer.appendChild(header);

            // Component-specific properties would be added here
            propertiesContainer.appendChild(componentContainer);
        });
    }

    private createPropertyField(
        container: HTMLElement, 
        label: string, 
        value: string, 
        onChange: (value: string) => void
    ): void {
        const field = document.createElement('div');
        field.style.marginBottom = '10px';

        const labelElement = document.createElement('div');
        labelElement.textContent = label;
        labelElement.style.marginBottom = '5px';
        field.appendChild(labelElement);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.style.width = '100%';
        input.style.backgroundColor = '#3a3a3a';
        input.style.border = 'none';
        input.style.padding = '5px';
        input.style.color = '#ffffff';
        input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
        field.appendChild(input);

        container.appendChild(field);
    }

    private createVectorField(
        container: HTMLElement,
        label: string,
        vector: Vector3,
        onChange: (value: Vector3) => void
    ): void {
        const field = document.createElement('div');
        field.style.marginBottom = '10px';

        const labelElement = document.createElement('div');
        labelElement.textContent = label;
        labelElement.style.marginBottom = '5px';
        field.appendChild(labelElement);

        const vectorContainer = document.createElement('div');
        vectorContainer.style.display = 'grid';
        vectorContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        vectorContainer.style.gap = '5px';

        ['x', 'y', 'z'].forEach(axis => {
            const input = document.createElement('input');
            input.type = 'number';
            input.value = vector[axis].toString();
            input.style.width = '100%';
            input.style.backgroundColor = '#3a3a3a';
            input.style.border = 'none';
            input.style.padding = '5px';
            input.style.color = '#ffffff';
            input.onchange = (e) => {
                const newValue = parseFloat((e.target as HTMLInputElement).value);
                const newVector = new Vector3(
                    axis === 'x' ? newValue : vector.x,
                    axis === 'y' ? newValue : vector.y,
                    axis === 'z' ? newValue : vector.z
                );
                onChange(newVector);
            };
            vectorContainer.appendChild(input);
        });

        field.appendChild(vectorContainer);
        container.appendChild(field);
    }

    private onViewportMouseDown(e: MouseEvent): void {
        this.isDragging = true;
        // Implementation for handling viewport interaction start
    }

    private onViewportMouseMove(e: MouseEvent): void {
        if (!this.isDragging) return;
        // Implementation for handling viewport interaction
    }

    private onViewportMouseUp(e: MouseEvent): void {
        this.isDragging = false;
        // Implementation for handling viewport interaction end
    }

    private onViewportWheel(e: WheelEvent): void {
        // Implementation for handling viewport zooming
    }

    private update(): void {
        this.editor.update();
        // Update viewport rendering
        requestAnimationFrame(this.update.bind(this));
    }
}
