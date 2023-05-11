import React, { MutableRefObject, Ref, useCallback, useEffect, useRef, useState } from 'react'
import { CubeTextureLoader, TextureLoader, Mesh, MeshBasicMaterial, SphereGeometry, BackSide, Sprite, SpriteMaterial, Raycaster, Vector2, Frustum, Matrix4, PointsMaterial, Points, Vector3, BufferAttribute, BufferGeometry, PlaneGeometry, Scene, PerspectiveCamera, WebGLRenderer, WebGLRenderTarget, MeshLambertMaterial, MeshNormalMaterial, AmbientLight, DirectionalLight, Box3, LoadingManager, Color, MathUtils } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import style from '@/style/full-view.module.scss';
import classNames from 'classnames/bind';
import gsap from 'gsap';
import Stats from 'stats.js';
import dat from 'dat.gui';
import Progress from './Progress';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const gui = new dat.GUI();
const params = {
  ambientColor: 0xffffff,
  directionalColor: 0xffffff,
};

const cls = classNames.bind(style);
const width = window.innerWidth;
const height = window.innerHeight;
const aspectRatio = width / height;

const manager = new LoadingManager();

const cubeTextureLoader = new CubeTextureLoader(manager);
const assetMap = new WeakMap();
const pointsMap = new WeakMap();

export default function FullView() {
  const canvasRef = useRef(null);
  const isTransfer = useRef(false);

  const scene = useRef(new Scene());
  const camera = useRef(new PerspectiveCamera(75, aspectRatio, .1, 100));
  camera.current.position.set(.4, .4, .4);
  
  const ambientLight = useRef(new AmbientLight(0xffffff, .7));
  // gui.add(ambientLight.current, 'intensity').min(.1).max(1).step(.05).name('环境光');
  // gui.addColor(params, 'ambientColor').onChange(() => {
  //   ambientLight.current.color = new Color(params.ambientColor);
  // }).name('环境光颜色');

  scene.current.add(camera.current);
  scene.current.add(ambientLight.current);

  const renderer = useRef(new WebGLRenderer());
  const _renderer = renderer.current;

  const controls = useRef(new OrbitControls(camera.current, renderer.current.domElement));
  controls.current.enablePan = false;
  controls.current.minDistance = .1;
  controls.current.maxDistance = 1;

  const animate = (callback?: () => void) => {
    let rafId = 0;
    const tick = () => {
      callback && callback();
      rafId = requestAnimationFrame(tick);
    }
    tick();
    return () => {
      cancelAnimationFrame(rafId);
    }
  }

  const loadMaterial = (imgs?: string[]) => {
    if (!imgs) {
      return new MeshLambertMaterial({ transparent: true, opacity: 1 });
    }
    const envTextureLoader = cubeTextureLoader.load(imgs);
    const sphereMaterial = new MeshLambertMaterial({
      envMap: envTextureLoader,
      side: BackSide,
      transparent: true,
    });
    envTextureLoader.flipY = true;
    return sphereMaterial;
  }

  const totalScenes = useRef<Mesh<SphereGeometry, MeshLambertMaterial>[]>([]);
  const loadScene = ({ target, textures }: { target: PointType, textures?: string[] }) => {
    const sphereGeometry = new SphereGeometry(1, 32, 32);
    const sceneMateria = loadMaterial(textures);
    const _scene = new Mesh(sphereGeometry.clone(), sceneMateria);
    _scene.position.set(target.x, target.y, target.z);
    _scene.userData = {
      isInit: !!textures,
    };
    const cx = target.x + .3;
    const cy = target.y + .4;
    const cz = target.z + .5;
    pointsMap.set(_scene, {
      camera: { x: cx, y: cy, z: cz },
      target
    });
    scene.current.add(_scene);
    totalScenes.current.push(_scene);
    return _scene;
  }

  const scene1 = useRef(loadScene({ target: { x: 0, y: 0, z: 0 }, textures: [
    '/images/full-view/px.png',
    '/images/full-view/nx.png',
    '/images/full-view/ny.png',
    '/images/full-view/py.png',
    '/images/full-view/pz.png',
    '/images/full-view/nz.png',
  ] }));
  const currentScene = useRef<Mesh>(scene1.current);
  const nextScene = useRef<Mesh | null>();
  const scene2 = useRef(loadScene({ target: { x: 3, y: 0, z: 0 } }));
  assetMap.set(scene2.current, [
    '/images/full-view/env2/px.png',
    '/images/full-view/env2/nx.png',
    '/images/full-view/env2/ny.png',
    '/images/full-view/env2/py.png',
    '/images/full-view/env2/pz.png',
    '/images/full-view/env2/nz.png',
  ]);
  const scene3 = useRef(loadScene({ target: { x: 0, y: 3, z: 0 } }));
  assetMap.set(scene3.current, [
    '/images/full-view/env3/px.png',
    '/images/full-view/env3/nx.png',
    '/images/full-view/env3/ny.png',
    '/images/full-view/env3/py.png',
    '/images/full-view/env3/pz.png',
    '/images/full-view/env3/nz.png',
  ]);

  useEffect(() => {
    const container = document.querySelector('.webgl');
    container?.appendChild(renderer.current.domElement);
    renderer.current.setSize(width, height);
    renderer.current.render(scene.current, camera.current);

    const cleaerAnimate = animate(() => {
      stats.begin();
      controls.current.update();

      // 更新CSS3D物体的位置和旋转
      renderer.current?.render(scene.current, camera.current);
      stats.end();
    });

    return () => {
      cleaerAnimate();
      _renderer.dispose();
    }
  }, [_renderer]);

  const handleChangeScene = (_nextScene: MutableRefObject<unknown>) => {
    isTransfer.current = true;
    const nextScene = _nextScene.current as Mesh;
    const _camera = camera.current;
    const _controls = controls.current;
    const points = pointsMap.get(nextScene);
    const { x: cX, y: cY, z: cZ } = points.camera;
    const { x: tX, y: tY, z: tZ } = points.target;
    const { x, y, z } = currentScene.current.position;
    console.log('xyz', x, y, z);

    const segment = new Vector3();
    segment.subVectors(currentScene.current.position, nextScene.position);
    const angleX = segment.angleTo(new Vector3(1, 0, 0));
    const angleY = segment.angleTo(new Vector3(0, 1, 0));
    const angleZ = segment.angleTo(new Vector3(0, 0, 1));
    const leaveToPoint = { x: 0, y: 0, z: 0 };
    leaveToPoint.x = Math.cos(angleX);
    leaveToPoint.y = Math.cos(angleY);
    leaveToPoint.z = Math.cos(angleZ);
    console.log(angleX, angleY, angleZ, leaveToPoint, segment.x, segment.y, segment.z);
    
    totalScenes.current.forEach(scene => {
      if (scene !== currentScene.current) {
        scene.material.opacity = 0;
      }
    });

    const tl = gsap.timeline();
    tl
      .to(_camera.position, { x, y, z, duration: 1 }, 0)
      .to(_controls.target, { x: x - leaveToPoint.x, y: y - leaveToPoint.y, z: z - leaveToPoint.z, duration: 1 }, 0)
      .to(_camera.position, { x: x - leaveToPoint.x, y: y - leaveToPoint.y, z: z - leaveToPoint.z, duration: 1 }, 1)
      .to(currentScene.current.material, { opacity: 0, duration: 1, onComplete: () => {
        _controls.target.set(tX, tY, tZ);
      } }, 1)
      .to(_camera.position, { x: cX, y: cY, z: cZ, duration: 1 }, 2)
      .to(nextScene.material, { opacity: 1, duration: 1, onComplete: () => {
        currentScene.current = nextScene;
        _nextScene.current = null;
        isTransfer.current = false;
      } }, 2);
  }

  const handleSwitch = (_nextScene: Mesh) => {
    if (isTransfer.current || _nextScene === currentScene.current) {
      return;
    }

    nextScene.current = _nextScene;
    if (!nextScene.current.userData.isInit) {
      const assets = assetMap.get(nextScene.current);
      console.log('加载场景', assets, assetMap)
      nextScene.current.material = loadMaterial(assets);
      nextScene.current.userData.isInit = true;
    } else {
      handleChangeScene(nextScene);
      console.log('该场景已经初始化', nextScene.current.userData.name);
    }
  }

  const onLoadedScene = () => {
    console.log('加载完成', nextScene.current);
    nextScene.current && handleChangeScene(nextScene);
  }

  return (
    <div>
      <div className="webgl" ref={canvasRef}></div>
      <div className={cls('operate')}>
        <div className={cls('operate-item')} onClick={ () => handleSwitch(scene1.current) }>小区</div>
        <div className={cls('operate-item')} onClick={ () => handleSwitch(scene2.current) }>电梯间</div>
        <div className={cls('operate-item')} onClick={ () => handleSwitch(scene3.current) }>屋里</div>
      </div>
      <Progress manager={manager} onFinished={onLoadedScene} />
    </div>
  )
}
