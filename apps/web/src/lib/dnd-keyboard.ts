// apps/web/src/lib/dnd-keyboard.ts — WCAG 2.1 SC 2.1.1
import{KeyboardSensor,PointerSensor,useSensor,useSensors}from '@dnd-kit/core'
import{sortableKeyboardCoordinates}from '@dnd-kit/sortable'
export function useKanbanSensors(){
  return useSensors(
    useSensor(PointerSensor,{activationConstraint:{distance:8}}),
    useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates})
  )
}
