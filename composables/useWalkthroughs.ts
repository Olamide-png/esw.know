import { ref } from 'vue'


export function useWalkthrough(ids: string[]) {
const done = ref<Record<string, boolean>>({})


function mark(id: string, value = true) {
done.value[id] = value
}


function isDone(id: string) {
return !!done.value[id]
}


function allDone() {
return ids.every((id) => !!done.value[id])
}


return { done, mark, isDone, allDone }
}