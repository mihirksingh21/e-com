'use client'
import React from 'react'
import Link from 'next/link'

import { Category } from '../../../../payload/payload-types'
import { useFilter } from '../../../_providers/Filter'

import classes from './index.module.scss'

type CategoryCardProps = {
  category: Category
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const media = category.media as Media | null; // Ensure media can be null
  const { setCategoryFilters } = useFilter();

  // Check if media and media.url are valid
  const backgroundImage = media && media.url ? `url(${media.url})` : undefined;

  return (
    <Link
      href="/products"
      className={classes.card}
      style={{ backgroundImage }}
      onClick={() => setCategoryFilters([category.id])}
    >
      <p className={classes.title}>{category.title}</p>
    </Link>
  )
}

export default CategoryCard;