import React from "react";

interface CheckboxProps {
  id: string;
  /** 是否被选中 */
  checked: boolean;
  /** 选中状态变化时的回调函数 */
  onChange: (checked: boolean) => void;
  /** 组件的名称 */
  name?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 显示的标签文字 */
  label?: string;
  /** 额外的自定义类名 */
  className?: string;
}

const checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  name,
  disabled,
  label,
  className,
  id,
}) => {
  return (
    <div className="flex items-center w-[fit-content] cursor-pointer">
      <input
        type="checkbox"
        id={id}
        disabled={disabled}
        name={name}
        checked={checked}
        className={"cursor-pointer " + className}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} className="text-sm ml-[4px] cursor-pointer">
        {label}
      </label>
    </div>
  );
};

export default checkbox;
