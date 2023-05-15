type KeysTuple<T> = keyof T ;
type PointType = { x: number, y: number, z: number };
type PropsType = { manager: any, onLoading?: (progress: number) => void, onFinished?: () => void }
