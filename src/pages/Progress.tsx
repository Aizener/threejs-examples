import { useRef, useState } from 'react';
import style from '@/style/progress.module.scss';
import classNames from 'classnames/bind';
const cls = classNames.bind(style);

export default function Progress(props: PropsType) {
  const [isLoad, setIsLoad] = useState(false);
  const [progress, setProgress] = useState(0);
  const loadedCount = useRef(0);
  const manager = props.manager;
  manager.onStart = () => {
    setIsLoad(true);
  };
  manager.onLoad = () => {
    setTimeout(() => {
      setIsLoad(false);
      setProgress(0);
      loadedCount.current = 0;
      props.onFinished && props.onFinished();
    }, 500)
  };
  manager.onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
    const _progress = Math.round(itemsLoaded / itemsTotal);
    const itemTotalNum = 6;
    if (_progress === 1 && loadedCount.current < itemTotalNum) {
      loadedCount.current += 1;
    }
    const progress = Number((loadedCount.current / itemTotalNum).toFixed(2)) * 100;
    setProgress(progress);
    props.onLoading && props.onLoading(progress);
    console.log(`Loading ${url}: ${progress}%`, itemsLoaded, itemsTotal, loadedCount.current);
  };

  return (
    <div className={cls('progress')} style={{display: isLoad ? 'block' : 'none'}}>
      <div className={cls('progress-title')}>加载场景中...</div>
      <div className={cls('progress-box')}>
        <p className={cls('progress-text')}>{progress ? `${progress}%` : '0%'}</p>
        <div className={cls('progress-inner')} style={{ width: `${progress}%`}}></div>
      </div>
    </div>
  )
}
