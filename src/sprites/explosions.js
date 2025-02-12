import { AnimatedSprite, Container, Texture } from "pixi.js"
import appConstants from "../common/constants"
import { destroySprite, randomIntFromInterval } from "../common/utils"
import { play } from "../common/sound"

let app
let explosions

const explosionTypes = ['Explosion_Sequence', 'Explosion_Sequence1', 'Explosion_Sequence2', 'Explosion_Sequence3']
const explosionTextures = {}

export const initExplosions = (currApp, root) => { // Ініціалізуємо 
    explosions = new Container()    // Створюємо контейнер
    explosions.name = appConstants.containers.explosions // Присвоюємо ім"я контейнеру
    app = currApp // Створюємо посилання на застосунок
    root.addChild(explosions) //
    return explosions
}

export const addExposion = (coords) => {
    const idx = randomIntFromInterval(0, explosionTypes.length - 1)
    const explosionType = explosionTypes[idx]
    let textures 
    if (explosionTextures[explosionType]) {
        textures = explosionTextures[explosionType]
    } else {
        textures = []
            for(let i = 0; i < 12; i++){
                const texture = Texture.from(`${explosionType} ${i + 1}.png`)
                textures.push(texture)
        }
        explosionTextures[explosionType] = textures
        
    }
    const explosion = new AnimatedSprite(textures)
    explosion.loop = false 
    explosion.animationSpeed = 0.2
    explosion.anchor.set(0.5)
    explosion.position.set(coords.x, coords.y)
    explosions.addChild(explosion)
    explosion.play()
    play(appConstants.sounds.explosion)
}

export const explosionTick = () => {
    const toRemove = []
    explosions.children.forEach((e) => {
        if (!e.playing) {
            toRemove.push(e)
        }
    })
    toRemove.forEach((e) => {
        destroySprite(e)
    })
}