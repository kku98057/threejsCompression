import * as THREE from "three";
import fragment from "../shaders/fragment.glsl";
import vertex from "../shaders/vertex.glsl";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module";

import gsap from "gsap";
import ScrollTrigger from "gsap/src/ScrollTrigger";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { KaleidoShader } from "three/examples/jsm/shaders/KaleidoShader";

import model from "../models/bike.glb";
import ship from "../models/scene.glb.gz";
import gamepad from "../models/gamepad.glb";

import sun from "../imgs/sun.jpg";
import earth from "../imgs/earthmap1k.jpg";
import bumpmap from "../imgs/earthbump.jpg";
import clouds from "../imgs/earthCloud.png";
import * as dat from "dat.gui";

export default class App {
  constructor() {
    gsap.registerPlugin(ScrollTrigger);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.container = document.querySelector(".webgl");
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 120);

    this.time = 0;
    this.scene.add(this.camera);
    new OrbitControls(this.camera, this.renderer.domElement);
    this.clock = new THREE.Clock();

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.glitchPass = new GlitchPass();

    // 필름

    this.filmPass = new FilmPass(1, 1, 3000, 0);
    this.shaderPass = new ShaderPass(KaleidoShader);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    this.bloomPass.threshold = 0;
    this.bloomPass.strength = 2;
    this.bloomPass.radius = 0;
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);

    this.addMesh();
    this.settings();
    this.setLight();

    this.setResize();
    this.render();
  }

  settings() {
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
  }
  setLight() {
    this.amb = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.amb);
    // 지구광원

    // 우주선내부광원
    this.light2 = new THREE.SpotLight(new THREE.Color("red"), 0.1);
    this.light2.angle = Math.PI * 0.75;

    // 우주선 외부광원
    this.outLight = new THREE.SpotLight(0xffffff, 10);
    this.outLighth = new THREE.SpotLightHelper(this.outLight);
    this.outLight.angle = Math.PI * 0.75;
  }

  addMesh() {
    this.mixer;
    this.loader = new GLTFLoader();
    this.loader2 = new GLTFLoader();
    this.loader3 = new GLTFLoader();
    this.draco = new DRACOLoader();
    this.draco.setDecoderPath("./asset/draco/");
    this.loader.setDRACOLoader(this.draco);
    // this.loader2.setDRACOLoader(this.draco);
    this.loader3.setDRACOLoader(this.draco);
    this.loader2.setMeshoptDecoder(MeshoptDecoder);
    console.log(MeshoptDecoder);
    this.loader.load(model, (obj) => {
      this.mixer = new THREE.AnimationMixer(obj.scene);
      this.bike = obj.scene;
      const action = this.mixer.clipAction(obj.animations[0]);
      this.bike.scale.set(0.1, 0.1, 0.1);
      this.bike.rotation.set(0, Math.PI * 1.4, Math.PI * 1.92);
      this.bike.position.set(0, 50, -60);
      action.play();
      this.scene.add(obj.scene);
    });
    this.loader2.load(ship, (ship) => {
      this.loader3.load(gamepad, (pad) => {
        // 비행선
        this.ship = ship.scene;
        console.log(ship);

        // this.scene.add(ship.scene);

        this.ship.add(this.light2);
        this.light2.position.set(
          this.ship.position.x,
          this.ship.position.y + 4.3,
          this.ship.position.z - 0.9
        );
        this.ship.add(this.outLight);
        this.outLight.position.set(
          this.ship.position.x,
          this.ship.position.y - 10,
          this.ship.position.z - 30
        );
        this.ship.position.set(0, -2.5, 110);
        // 창문 유리재질로변경
        this.ship.traverse((ci) => {
          if (ci.isObject3D) {
            if (ci.material) {
              ci.material.side = THREE.DoubleSide;
            }
          }
        });
        const shiptop = ship.scene.getObjectByName(
          "Sci-Fi_Space_Station_RoofBackdrop_0"
        );
        const shipbottom = ship.scene.getObjectByName(
          "Sci-Fi_Space_Station_RoofBackdrop_0"
        );

        const shipWindow = ship.scene.getObjectByName(
          "Sci-Fi_Space_Station_Window_0"
        );
        const widnowMaterial = shipWindow.material;

        widnowMaterial.ior = 2.5;
        widnowMaterial.thickness = 1;
        widnowMaterial.roughness = 0;
        widnowMaterial.transparent = true;
        widnowMaterial.opacity = 0.05;
        widnowMaterial.reflectivity = 1;
        // 게임패드
        this.pad = pad.scene;
        this.pad.scale.set(10, 10, 10);
        this.pad.rotation.y = Math.PI * -0.45;
        this.pad.rotation.x = Math.PI * 2.1;
        this.pad.rotation.z = Math.PI * -0.1;
        this.pad.position.set(-130, 50, -100);
        this.scene.add(this.pad);

        // 마우스이벤트
        window.addEventListener("mousemove", (e) => {
          this.mouse = {
            x: e.clientX,
            y: e.clientY,
          };
          this.camera.rotation.y = THREE.MathUtils.lerp(
            this.camera.rotation.y,
            this.mouse.x * Math.PI * 0.00001,
            0.1
          );
          this.camera.rotation.x = THREE.MathUtils.lerp(
            this.camera.rotation.x,
            this.mouse.y * Math.PI * 0.00001,
            0.1
          );
        });
        this.gsap();
        ScrollTrigger.refresh();
      });
    });

    // 우주
    this.spaceObj = new THREE.Object3D();
    this.spaceGeo = new THREE.SphereGeometry(64, 64, 64);
    this.spaceMaterial = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      color: 0x00000,
    });
    this.space = new THREE.Mesh(this.spaceGeo, this.spaceMaterial);
    this.space.scale.set(3, 3, 3);
    // 별
    this.starsGeo = new THREE.BufferGeometry();
    this.starsMaterial = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.stars = new THREE.Points(this.starsGeo, this.starsMaterial);
    this.starsVector = new THREE.Vector3();
    this.starsPosition = [];
    for (let i = 0; i < 1500; i++) {
      this.starsVector.x = -400 + Math.random() * 800;
      this.starsVector.y = -400 + Math.random() * 800;
      this.starsVector.z = -400 + Math.random() * 800;
      this.starsPosition.push(
        this.starsVector.x,
        this.starsVector.y,
        this.starsVector.z
      );
    }
    this.starsGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.starsPosition, 3)
    );

    this.spaceObj.add(this.stars);

    // 태양

    this.sunGeo = new THREE.IcosahedronGeometry(32, 100);
    this.sunMaterial = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load(sun),
      color: new THREE.Color("#fdb813"),
    });

    this.sun = new THREE.Mesh(this.sunGeo, this.sunMaterial);
    this.sun.position.set(-30, -30, 0);

    // 지구
    this.earthObj = new THREE.Object3D();
    this.earthGeo = new THREE.SphereGeometry(32, 32, 32);
    this.cloudhGeo = new THREE.SphereGeometry(32, 32, 32);
    this.earthMaterial = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load(earth),
      bumpMap: new THREE.TextureLoader().load(bumpmap),
    });
    this.cloudsMaterial = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load(clouds),
      transparent: true,
    });
    this.clouds = new THREE.Mesh(this.cloudhGeo, this.cloudsMaterial);
    this.earth = new THREE.Mesh(this.earthGeo, this.earthMaterial);
    this.earth.scale.set(0.5, 0.5, 0.5);
    this.clouds.scale.set(0.51, 0.51, 0.51);
    this.earthObj.add(this.earth, this.clouds);
    this.earthObj.position.set(120, 15, -100);
    //씬에 추가
    this.scene.add(this.spaceObj, this.sun, this.earthObj);
  }

  gsap() {
    ScrollTrigger.config({ ignoreMobileResize: true });
    ScrollTrigger.normalizeScroll(true); // enable
    let normalizer = ScrollTrigger.normalizeScroll();

    const earthPos = gsap.set(this.earthObj.position, { y: -100 });
    const sunPos = gsap.set(this.sun.position, { y: -100 });
    const bg = new THREE.Color("#ffffff");
    const sections = document.querySelectorAll("section");

    const main = () => {
      const tl = gsap
        .timeline({
          scrollTrigger: {
            trigger: "main",
            start: "15.39% 100%",
            end: "84.61% 0%",
            scrub: 3,
          },
        })
        .to(this.camera.position, {
          x: this.sun.position.x,
          y: this.sun.position.y + 1,
          z: this.sun.position.z + 80,
          duration: 1.5,
          ease: "power4.inout",
        })
        .to(this.camera.position, {
          x: this.earthObj.position.x,
          y: this.earthObj.position.y + 1,
          z: this.earthObj.position.z + 40,
          ease: "power4.inout",
          duration: 2.5,
        })
        .to(this.camera.position, {
          x: this.bike.position.x - 10,
          y: this.bike.position.y,
          z: this.bike.position.z + 110,
          ease: "power4.inout",
          duration: 3,
        })
        .to(this.camera.position, {
          x: this.pad.position.x,
          y: this.pad.position.y,
          z: this.pad.position.z + 50,
          ease: "power4.inout",
        });
    };
    main();
  }
  setResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }
  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
  update() {
    this.delta = this.clock.getDelta();

    this.oldtime = this.clock.oldTime * 0.0005;

    if (this.earthObj) {
      this.earth.rotation.x += this.delta * 0.02;
      this.earth.rotation.y += this.delta * 0.1;
      this.clouds.rotation.x += this.delta * 0.0005;
      this.clouds.rotation.y += this.delta * 0.05;
    }
    if (this.sun) {
      this.sun.rotation.x += this.delta * 0.005;
      this.sun.rotation.y += this.delta * 0.05;
    }

    if (this.stars) {
      this.stars.rotation.y += this.delta * 0.01;
      this.stars.rotation.x += this.delta * 0.01;
      this.stars.rotation.z += this.delta * 0.01;
    }
    if (this.pad) {
      this.pad.rotation.y += this.delta;
    }
  }
  render() {
    this.renderer.render(this.scene, this.camera);
    // this.composer.render();
    this.update();
    requestAnimationFrame(this.render.bind(this));
  }
}
