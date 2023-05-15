import { MutableRefObject, useEffect, useRef } from 'react'
import { CubeTextureLoader, Mesh, SphereGeometry, BackSide, Vector3, Scene, PerspectiveCamera, WebGLRenderer, MeshLambertMaterial, AmbientLight, LoadingManager, Color } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import style from '@/style/full-view.module.scss';
import classNames from 'classnames/bind';
import gsap from 'gsap';
import Stats from 'stats.js';
import dat from 'dat.gui';
import Progress from './Progress';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
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
  camera.current.position.set(0, .1, .4);
  
  const ambientLight = useRef(new AmbientLight(0xffffff, .7));

  const gui = useRef(new dat.GUI({
    autoPlace: false,
  }));
  gui.current.add(ambientLight.current, 'intensity').min(.1).max(1).step(.05).name('环境光');
  gui.current.addColor(params, 'ambientColor').onChange(() => {
    ambientLight.current.color = new Color(params.ambientColor);
  }).name('环境光颜色');

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
    const cx = target.x;
    const cy = target.y;
    const cz = target.z + .5;
    pointsMap.set(_scene, {
      camera: { x: cx, y: cy, z: cz },
      target
    });
    scene.current.add(_scene);
    totalScenes.current.push(_scene);
    return _scene;
  }
  const getPublicPath = (paths: string[]) => {
    return paths.map(path => {
      return `/three-examples//images/${path}`;
    });
  }

  const scene1 = useRef(loadScene({ target: { x: 0, y: 0, z: 0 } }));
  const currentScene = useRef<Mesh>(scene1.current);
  assetMap.set(scene1.current, getPublicPath([
    'full-view/gate/px.png',
    'full-view/gate/nx.png',
    'full-view/gate/ny.png',
    'full-view/gate/py.png',
    'full-view/gate/pz.png',
    'full-view/gate/nz.png',
  ]))
  const nextScene = useRef<Mesh | null>();
  const scene2 = useRef(loadScene({ target: { x: 0, y: 0, z: -3 } }));
  assetMap.set(scene2.current, getPublicPath([
    'full-view/village/px.png',
    'full-view/village/nx.png',
    'full-view/village/ny.png',
    'full-view/village/py.png',
    'full-view/village/pz.png',
    'full-view/village/nz.png',
  ]));
  const scene3 = useRef(loadScene({ target: { x: 0, y: 3, z: -6 } }));
  assetMap.set(scene3.current, getPublicPath([
    'full-view/room/px.png',
    'full-view/room/nx.png',
    'full-view/room/ny.png',
    'full-view/room/py.png',
    'full-view/room/pz.png',
    'full-view/room/nz.png',
  ]));

  useEffect(() => {
    const box = document.querySelector('.full-view');
    if (box) {
      box.appendChild(stats.dom);
      box.appendChild(gui.current.domElement);
      gui.current.domElement.classList.add('my-gui');
    }
    scene1.current.material = loadMaterial(assetMap.get(scene1.current));
    scene1.current.userData.isInit = true;

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
    const { x: cx, y: cy, z: cz } = points.camera;
    const { x: tx, y: ty, z: tz } = points.target;
    const { x, y, z } = currentScene.current.position;

    const segment = new Vector3();
    segment.subVectors(currentScene.current.position, nextScene.position);
    const angleX = segment.angleTo(new Vector3(1, 0, 0));
    const angleY = segment.angleTo(new Vector3(0, 1, 0));
    const angleZ = segment.angleTo(new Vector3(0, 0, 1));
    const bx = Math.cos(angleX);
    const by = Math.cos(angleY);
    const bz = Math.cos(angleZ);
    
    totalScenes.current.forEach(scene => {
      if (scene !== currentScene.current) {
        scene.material.opacity = 0;
      }
    });

    const tl = gsap.timeline();
    tl
      .to(currentScene.current.material, { opacity: 0, duration: 1 }, 0)
      .to(_camera.position, { x: x, y: y, z: z, duration: 1 }, 0)
      .to(_controls.target, { x: x - bx, y: y - by, z: z - bz, duration: 1, onComplete: () => {
        _camera.position.set(cx, cy, cz);
        _controls.target.set(tx, ty, tz);
      } }, 0)
      .to(nextScene.material, { opacity: 1, duration: 1 }, 1)
      .to(_controls.target, { x: tx, y: ty, z: tz, duration: 1, onComplete: () => {
        currentScene.current = nextScene;
        _nextScene.current = null;
        isTransfer.current = false;
      } }, 1)
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
    <div className="full-view">
      <div className="webgl" ref={canvasRef}></div>
      <div className={cls('operate')}>
        <div className={cls('operate-item')} onClick={ () => handleSwitch(scene1.current) }>大门</div>
        <div className={cls('operate-item')} onClick={ () => handleSwitch(scene2.current) }>小区</div>
        <div className={cls('operate-item')} onClick={ () => handleSwitch(scene3.current) }>房间</div>
      </div>
      <Progress manager={manager} onFinished={onLoadedScene} />
    </div>
  )
}
