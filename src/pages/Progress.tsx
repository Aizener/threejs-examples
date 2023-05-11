import React, { useState } from 'react';
import style from '@/style/progress.module.scss';
import classNames from 'classnames/bind';
const cls = classNames.bind(style);

type PropsType = { manager: any, onLoading?: (progress: number) => void, onFinished?: () => void }
export default function Progress(props: PropsType) {
  const [isLoad, setIsLoad] = useState(false);
  const [progress, setProgress] = useState(0);
  const manager = props.manager;
  manager.onStart = () => {
    setIsLoad(true);
  };
  manager.onLoad = () => {
    setTimeout(() => {
      setIsLoad(false);
      props.onFinished && props.onFinished();
      setProgress(0);
    }, 500)
  };
  manager.onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
    const progress = Math.round(itemsLoaded / itemsTotal) * 100;
    setProgress(progress);
    props.onLoading && props.onLoading(progress);
    console.log(`Loading ${url}: ${progress}%`);
  };

  return (
    <div className={cls('progress')} style={{display: isLoad ? 'block' : 'none'}}>
      <div className={cls('progress-title')}>初次进入，加载场景中...</div>
      <div className={cls('progress-box')}>
        <p className={cls('progress-text')}>{progress ? `${progress}%` : ''}</p>
        <div className={cls('progress-inner')} style={{ width: `${progress}%`}}></div>
      </div>
    </div>
  )
}
