<template>
    <div
        class="slider"
        :title="this.modelValue"
        @wheel.prevent.stop="handleWheel"
        @mousedown="handleMouse"
        @mousemove="handleMouse"
        @mouseleave="handleMouse"
    >
        <div class="slider-highlight-wrapper">
            <div
                class="slider-highlight"
                :style="{ width: percentValue + '%' }"
            ></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    props: {
        modelValue: {
            type: Number,
            required: true,
        },
        min: {
            type: Number,
            default: 0,
        },
        max: {
            type: Number,
            default: 100,
        },
    },
    computed: {
        percentValue(): number {
            return this.valueToPercent(this.modelValue);
        },
    },
    methods: {
        valueToPercent(value: number): number {
            return ((value - this.min) / this.max) * 100;
        },
        percentToValue(percent: number): number {
            return this.min + ((this.max - this.min) * percent) / 100;
        },
        handleWheel(evt: WheelEvent) {
            const increase = -evt.deltaY;
            const newPercent = Math.max(
                0,
                Math.min(100, this.percentValue + increase)
            );
            const newValue = this.percentToValue(newPercent);
            this.$emit('update:modelValue', newValue);
        },
        handleMouse(evt: MouseEvent) {
            if (evt.buttons === 1) {
                const elRect = this.$el.getBoundingClientRect();
                const clickPercent =
                    ((evt.clientX - elRect.x) / elRect.width) * 100;
                const boundedPercent = Math.round(
                    Math.max(0, Math.min(100, clickPercent))
                );
                this.$emit(
                    'update:modelValue',
                    this.percentToValue(boundedPercent)
                );
            }
        },
    },
});
</script>

<style lang="scss" scoped>
@import '../styles/colors.scss';

.slider-highlight {
    background-color: $colors-success;
    height: 100%;
}
.slider-highlight-wrapper {
    background-color: $colors-selected;
    width: 100%;
    height: 100%;
}
.slider {
    border: 2px solid $colors-highlight;
}
</style>
